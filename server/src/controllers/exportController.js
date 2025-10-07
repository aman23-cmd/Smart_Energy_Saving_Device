import { EnergyRecord } from '../models/EnergyRecord.js';
import { stringify } from 'csv-stringify';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

export async function exportCsv(req, res) {
  const records = await EnergyRecord.find({ userId: req.user.userId }).sort({ timestamp: 1 }).lean();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="energy_records.csv"');

  const stringifier = stringify({ header: true, columns: ['timestamp', 'usageKWh', 'note'] });
  stringifier.on('readable', () => {
    let row;
    while ((row = stringifier.read())) {
      res.write(row);
    }
  });
  stringifier.on('error', (err) => res.status(500).end(err.message));
  stringifier.on('finish', () => res.end());

  for (const r of records) {
    stringifier.write([r.timestamp.toISOString(), r.usageKWh, r.note || '']);
  }
  stringifier.end();
}

export async function exportPdf(req, res) {
  const records = await EnergyRecord.find({ userId: req.user.userId }).sort({ timestamp: 1 }).lean();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="energy_report.pdf"');

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text('Smart Energy Report', { align: 'center' });
  doc.moveDown();

  const total = records.reduce((sum, r) => sum + r.usageKWh, 0);
  const avg = records.length ? total / records.length : 0;

  doc.fontSize(12).text(`Total records: ${records.length}`);
  doc.text(`Total kWh: ${total.toFixed(2)}`);
  doc.text(`Average kWh: ${avg.toFixed(2)}`);
  doc.moveDown();

  doc.text('Entries:');
  for (const r of records.slice(-200)) {
    doc.text(`${new Date(r.timestamp).toLocaleString()} - ${r.usageKWh} kWh ${r.note ? '(' + r.note + ')' : ''}`);
  }

  doc.end();
}

export async function sendEmailReport(req, res) {
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ message: 'Missing recipient email' });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const records = await EnergyRecord.find({ userId: req.user.userId }).sort({ timestamp: 1 }).lean();
  const total = records.reduce((sum, r) => sum + r.usageKWh, 0);
  const avg = records.length ? total / records.length : 0;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    to,
    subject: 'Your Smart Energy Report',
    text: `Total records: ${records.length}\nTotal kWh: ${total.toFixed(2)}\nAverage kWh: ${avg.toFixed(2)}`,
  });

  return res.json({ id: info.messageId });
}
