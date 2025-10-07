import { EnergyRecord } from '../models/EnergyRecord.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createRecord(req, res) {
  const { timestamp, usageKWh, note } = req.body || {};
  if (usageKWh == null || timestamp == null) {
    return res.status(400).json({ message: 'timestamp and usageKWh are required' });
  }
  const record = await EnergyRecord.create({
    userId: req.user.userId,
    timestamp: new Date(timestamp),
    usageKWh: Number(usageKWh),
    note,
  });
  return res.status(201).json({ record });
}

export async function listRecords(req, res) {
  const { limit = 200, start, end } = req.query;
  const query = { userId: req.user.userId };
  if (start || end) {
    query.timestamp = {};
    if (start) query.timestamp.$gte = new Date(start);
    if (end) query.timestamp.$lte = new Date(end);
  }
  const records = await EnergyRecord.find(query).sort({ timestamp: -1 }).limit(Number(limit));
  return res.json({ records });
}

export async function stats(req, res) {
  const userId = req.user.userId;
  const { month } = req.query; // YYYY-MM optional

  const match = { userId };
  if (month) {
    const [y, m] = month.split('-').map((s) => Number(s));
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));
    match.timestamp = { $gte: from, $lt: to };
  }

  const [agg] = await EnergyRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalKWh: { $sum: '$usageKWh' },
        avgKWh: { $avg: '$usageKWh' },
        latestAt: { $max: '$timestamp' },
      },
    },
  ]);

  return res.json({
    stats: agg || { count: 0, totalKWh: 0, avgKWh: 0, latestAt: null },
  });
}

export async function predictPeak(req, res) {
  // fetch last 60 days of records for user
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const records = await EnergyRecord.find({ userId: req.user.userId, timestamp: { $gte: since } })
    .sort({ timestamp: 1 })
    .lean();

  const pyPath = path.resolve(__dirname, '../../../ai/predict.py');
  const py = spawn('python3', [pyPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  const input = JSON.stringify({ records });
  let out = '';
  let err = '';
  py.stdout.on('data', (d) => (out += d.toString()));
  py.stderr.on('data', (d) => (err += d.toString()));
  py.on('close', (code) => {
    if (code !== 0) {
      console.error('predict.py failed', code, err);
      return res.status(500).json({ message: 'Prediction failed' });
    }
    try {
      const data = JSON.parse(out || '{}');
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ message: 'Prediction parse error' });
    }
  });
  py.stdin.write(input);
  py.stdin.end();
}

export async function trainModel(req, res) {
  // Train model using user's historical records
  const records = await EnergyRecord.find({ userId: req.user.userId })
    .sort({ timestamp: 1 })
    .lean();

  const pyPath = path.resolve(__dirname, '../../../ai/train.py');
  const py = spawn('python3', [pyPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  const input = JSON.stringify({ records });
  let out = '';
  let err = '';
  py.stdout.on('data', (d) => (out += d.toString()));
  py.stderr.on('data', (d) => (err += d.toString()));
  py.on('close', (code) => {
    if (code !== 0) {
      console.error('train.py failed', code, err);
      return res.status(500).json({ message: 'Training failed' });
    }
    try {
      const data = JSON.parse(out || '{}');
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ message: 'Training parse error' });
    }
  });
  py.stdin.write(input);
  py.stdin.end();
}
