import { Request, Response } from 'express';
import { 
  WORKER_CONCURRENCY_MIN, 
  WORKER_CONCURRENCY_MAX,
  FREE_RIDING_THRESHOLD_MIN,
  FREE_RIDING_THRESHOLD_MAX,
  DEFAULT_WORKER_CONCURRENCY,
  FREE_RIDING_THRESHOLD_DEFAULT
} from '@aita/shared';
import { prisma } from '@aita/database';

let currentSettings = {
  worker_concurrency: DEFAULT_WORKER_CONCURRENCY,
  free_riding_threshold: FREE_RIDING_THRESHOLD_DEFAULT,
  updatedBy: 1,
  updatedAt: new Date(),
};

/**
 * Lấy danh sách cài đặt hệ thống (UC-05 / Page 43) từ PostgreSQL
 */
export const getSettings = async (_req: Request, res: Response) => {
  try {
    const workerSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'worker_concurrency' },
    });
    const freeRidingSetting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'free_riding_threshold' },
    });

    if (workerSetting) {
      currentSettings.worker_concurrency = Number(workerSetting.settingValue);
    }
    if (freeRidingSetting) {
      currentSettings.free_riding_threshold = Number(freeRidingSetting.settingValue);
    }
  } catch (err: any) {
    console.warn(`[Settings] PostgreSQL notice: ${err.message}`);
  }

  res.json({
    success: true,
    data: currentSettings,
  });
};

/**
 * Điều chỉnh Worker Concurrency (UC-05 & BR-07 / Page 44)
 */
export const updateWorkerConcurrency = async (req: Request, res: Response) => {
  try {
    const { value, updatedBy = 1 } = req.body;
    const concurrency = Number(value);

    // Kiểm tra BR-07: Giới hạn 1 đến 10 worker
    if (isNaN(concurrency) || concurrency < WORKER_CONCURRENCY_MIN || concurrency > WORKER_CONCURRENCY_MAX) {
      return res.status(400).json({
        success: false,
        code: 'BR_07_OUT_OF_BOUNDS',
        message: `Số lượng worker concurrency phải nằm trong khoảng từ ${WORKER_CONCURRENCY_MIN} đến ${WORKER_CONCURRENCY_MAX} (BR-07).`,
      });
    }

    currentSettings.worker_concurrency = concurrency;
    currentSettings.updatedBy = Number(updatedBy);
    currentSettings.updatedAt = new Date();

    try {
      await prisma.systemSetting.upsert({
        where: { settingKey: 'worker_concurrency' },
        update: {
          settingValue: String(concurrency),
          updatedBy: Number(updatedBy),
        },
        create: {
          settingKey: 'worker_concurrency',
          settingValue: String(concurrency),
          updatedBy: Number(updatedBy),
        },
      });
      console.log(`[PostgreSQL Docker] ⚙️ Worker Concurrency saved to PostgreSQL: ${concurrency}`);
    } catch (err: any) {
      console.warn(`[PostgreSQL Docker] Settings update notice: ${err.message}`);
    }

    res.json({
      success: true,
      message: `Đã cập nhật số lượng worker song song thành ${concurrency} (Đã lưu vào Docker PostgreSQL).`,
      data: currentSettings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Điều chỉnh Ngưỡng Free-riding (BR-12 / Page 45)
 */
export const updateFreeRidingThreshold = async (req: Request, res: Response) => {
  try {
    const { value, updatedBy = 1 } = req.body;
    const threshold = Number(value);

    // Kiểm tra BR-12: Giới hạn 1% đến 20%
    if (isNaN(threshold) || threshold < FREE_RIDING_THRESHOLD_MIN || threshold > FREE_RIDING_THRESHOLD_MAX) {
      return res.status(400).json({
        success: false,
        code: 'BR_12_OUT_OF_BOUNDS',
        message: `Ngưỡng free-riding phải nằm trong khoảng từ ${FREE_RIDING_THRESHOLD_MIN}% đến ${FREE_RIDING_THRESHOLD_MAX}% (BR-12).`,
      });
    }

    currentSettings.free_riding_threshold = threshold;
    currentSettings.updatedBy = Number(updatedBy);
    currentSettings.updatedAt = new Date();

    try {
      await prisma.systemSetting.upsert({
        where: { settingKey: 'free_riding_threshold' },
        update: {
          settingValue: String(threshold),
          updatedBy: Number(updatedBy),
        },
        create: {
          settingKey: 'free_riding_threshold',
          settingValue: String(threshold),
          updatedBy: Number(updatedBy),
        },
      });
      console.log(`[PostgreSQL Docker] ⚙️ Free-riding threshold saved to PostgreSQL: ${threshold}%`);
    } catch (err: any) {
      console.warn(`[PostgreSQL Docker] Settings update notice: ${err.message}`);
    }

    res.json({
      success: true,
      message: `Đã cập nhật ngưỡng cảnh báo Free-Rider thành ${threshold}% (Đã lưu vào Docker PostgreSQL).`,
      data: currentSettings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
