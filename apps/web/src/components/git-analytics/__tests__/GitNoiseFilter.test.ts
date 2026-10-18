import { describe, it, expect } from 'vitest';
import { EXCLUDED_PATH_PATTERNS } from '@aita/shared';

// Hàm kiểm tra lọc nhiễu theo BR-13
export function isNoisePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  
  // Kiểm tra folder phổ biến
  const excludedFolders = ['node_modules/', 'dist/', 'build/', '.next/', 'out/', '.git/'];
  if (excludedFolders.some(f => normalized.includes(f) || normalized.startsWith(f))) {
    return true;
  }

  // Kiểm tra lockfile
  const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
  if (lockfiles.some(l => normalized.endsWith(l))) {
    return true;
  }

  // Kiểm tra file minified & map
  if (normalized.endsWith('.min.js') || normalized.endsWith('.min.css') || normalized.endsWith('.map')) {
    return true;
  }

  // Kiểm tra assets binary & media
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar.gz'];
  if (binaryExtensions.some(ext => normalized.toLowerCase().endsWith(ext))) {
    return true;
  }

  return false;
}

// Hàm parser mô phỏng git log --numstat với bộ lọc nhiễu BR-13
export function parseNumstatWithNoiseFilter(numstatLines: string[]) {
  let totalAdded = 0;
  let totalDeleted = 0;
  const acceptedFiles: string[] = [];
  const rejectedFiles: string[] = [];

  for (const line of numstatLines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;

    const added = parseInt(parts[0], 10) || 0;
    const deleted = parseInt(parts[1], 10) || 0;
    const filePath = parts.slice(2).join(' ');

    if (isNoisePath(filePath)) {
      rejectedFiles.push(filePath);
    } else {
      acceptedFiles.push(filePath);
      totalAdded += added;
      totalDeleted += deleted;
    }
  }

  return { totalAdded, totalDeleted, acceptedFiles, rejectedFiles };
}

describe('Task 20: Git Noise Filtering Engine (BR-13)', () => {
  it('danh sách mẫu lọc rác EXCLUDED_PATH_PATTERNS chứa đầy đủ các định dạng theo BR-13', () => {
    expect(EXCLUDED_PATH_PATTERNS).toContain('node_modules/**');
    expect(EXCLUDED_PATH_PATTERNS).toContain('dist/**');
    expect(EXCLUDED_PATH_PATTERNS).toContain('package-lock.json');
    expect(EXCLUDED_PATH_PATTERNS).toContain('yarn.lock');
    expect(EXCLUDED_PATH_PATTERNS).toContain('pnpm-lock.yaml');
    expect(EXCLUDED_PATH_PATTERNS).toContain('bun.lockb');
  });

  it('lọc bỏ hoàn toàn các dependencies và thư mục build tự sinh', () => {
    expect(isNoisePath('node_modules/react/index.js')).toBe(true);
    expect(isNoisePath('packages/web/node_modules/axios/package.json')).toBe(true);
    expect(isNoisePath('dist/bundle.js')).toBe(true);
    expect(isNoisePath('build/static/js/main.chunk.js')).toBe(true);
    expect(isNoisePath('.next/server/pages/index.js')).toBe(true);
    expect(isNoisePath('.git/objects/3f/67e18')).toBe(true);
  });

  it('lọc bỏ các tệp lockfiles của mọi package manager', () => {
    expect(isNoisePath('package-lock.json')).toBe(true);
    expect(isNoisePath('apps/web/package-lock.json')).toBe(true);
    expect(isNoisePath('yarn.lock')).toBe(true);
    expect(isNoisePath('pnpm-lock.yaml')).toBe(true);
    expect(isNoisePath('bun.lockb')).toBe(true);
  });

  it('lọc bỏ các tệp minified, sourcemap và media binary assets', () => {
    expect(isNoisePath('public/vendor/bootstrap.min.js')).toBe(true);
    expect(isNoisePath('static/styles.min.css')).toBe(true);
    expect(isNoisePath('dist/index.js.map')).toBe(true);
    expect(isNoisePath('assets/images/hero-banner.png')).toBe(true);
    expect(isNoisePath('assets/icons/logo.svg')).toBe(true);
    expect(isNoisePath('docs/specifications.pdf')).toBe(true);
    expect(isNoisePath('releases/v1.0.0.zip')).toBe(true);
  });

  it('chấp nhận và giữ lại mã nguồn thực thi hợp lệ của sinh viên', () => {
    expect(isNoisePath('src/App.tsx')).toBe(false);
    expect(isNoisePath('src/components/DashboardPortal.tsx')).toBe(false);
    expect(isNoisePath('apps/api/src/controllers/gitController.ts')).toBe(false);
    expect(isNoisePath('packages/shared/src/constants.ts')).toBe(false);
    expect(isNoisePath('server/main.go')).toBe(false);
    expect(isNoisePath('tests/unit/test_eval.py')).toBe(false);
  });

  it('loại trừ commit bơm LOC ảo từ package-lock.json và node_modules khi tính tổng LOC', () => {
    const rawNumstat = [
      '150\t20\tsrc/components/git-analytics/MemberDetailsModal.tsx',
      '45000\t0\tpackage-lock.json', // Bơm 45,000 dòng ảo
      '120000\t500\tnode_modules/lucide-react/dist/index.js', // Bơm 120,000 dòng ảo
      '85\t12\tsrc/components/git-analytics/FreeRidingThresholdModal.tsx',
      '30\t5\tapps/web/vite.config.ts',
      '500\t0\tpublic/images/avatar.png', // Binary asset rác
    ];

    const result = parseNumstatWithNoiseFilter(rawNumstat);

    // Chỉ tính 150 + 85 + 30 = 265 dòng thêm
    expect(result.totalAdded).toBe(265);
    // Chỉ tính 20 + 12 + 5 = 37 dòng xóa
    expect(result.totalDeleted).toBe(37);

    // Kiểm tra danh sách file bị loại bỏ
    expect(result.rejectedFiles).toContain('package-lock.json');
    expect(result.rejectedFiles).toContain('node_modules/lucide-react/dist/index.js');
    expect(result.rejectedFiles).toContain('public/images/avatar.png');

    // Kiểm tra danh sách file hợp lệ
    expect(result.acceptedFiles).toHaveLength(3);
  });
});
