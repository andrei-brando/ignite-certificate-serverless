import chromium from "chrome-aws-lambda";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";
import { document } from "../utils/dynamodbClient";
import dayjs from "dayjs";
import { S3 } from "aws-sdk";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  grade: string;
  date: string;
  medal: string;
}

const compile = async (data: ITemplate) => {
  const filePath = path.join(
    process.cwd(),
    "src",
    "templates",
    "certificate.hbs"
  );

  const html = fs.readFileSync(filePath, "utf8");

  return handlebars.compile(html)(data);
};

export const handle = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;
  await document
    .put({
      TableName: "users_certificates",
      Item: {
        id,
        name,
        grade,
      },
    })
    .promise();

  const medalPath = path.join(process.cwd(), "src", "templates", "selo.png");
  const medal = fs.readFileSync(medalPath, "base64");

  const data: ITemplate = {
    date: dayjs().format("DD/MM/YYYY"),
    grade,
    name,
    id,
    medal,
  };

  // gera certificado
  // compilar usando handlebars
  const content = await compile(data);

  // tranformar em PDF

  const browser = await chromium.puppeteer.launch({
    headless: true,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
  });

  const page = await browser.newPage();

  await page.setContent(content);

  const pdf = await page.pdf({
    format: "a4",
    path: process.env.IS_OFFLINE ? "certificate.pdf" : null,
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  // salvar no s3

  const s3 = new S3();

  await s3
    .putObject({
      Bucket: "serverlessignitecertificateandrei",
      Key: `${id}.pdf`,
      ACL: "public-read",
      Body: pdf,
      ContentType: "application/pdf",
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Certificate Created",
    }),
    headers: {
      "Content-type": "application/json",
    },
  };
};
