// build-scripts/build-vfs.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- 설정 ---
const WP_CORE_PATH = './wordpress';       // 워드프레스 코어 경로
const PLUGINS_PATH = './plugins';         // 플러그인들이 모여있는 경로
const THEMES_PATH = './themes';           // 테마들이 모여있는 경로
const OUTPUT_DIR = './dist';               // 결과물 저장 경로
const DICT_SIZE = 112640;                  // 사전 크기 (약 110KB, Worker 메모리 고려)
const VFS_NAME = 'wp_vfs_bundle.zstd';
const DICT_NAME = 'wp_vfs_dict.dict';

/**
 * 1. 빌드 디렉토리 준비
 */
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 2. Zstd 사전 훈련 (Dictionary Training)
 * PHP, CSS, JS 파일들만 샘플링하여 효율적인 사전을 생성합니다.
 */
function trainDictionary() {
  console.log('--- [1/3] Zstd 사전 훈련 시작 ---');
  
  // 훈련에 사용할 샘플 파일 리스트 생성 (PHP, JS, CSS 위주)
  // find 명령어가 너무 길어질 경우, Node.js로 직접 파일 목록을 구성할 수 있습니다.
  const sampleCmd = `find ${WP_CORE_PATH} ${PLUGINS_PATH} ${THEMES_PATH} -type f \\( -name "*.php" -o -name "*.js" -o -name "*.css" \\) | head -n 1000`;
  let samples = '';
  try {
    samples = execSync(sampleCmd).toString().split('\n').filter(Boolean).join(' ');
  } catch (err) {
    console.warn('샘플 파일 목록 생성 중 오류 발생. 일부 파일이 누락될 수 있습니다.', err.message);
  }

  if (!samples) {
    console.error('사전 훈련을 위한 샘플 파일이 충분하지 않습니다. 빌드를 중단합니다.');
    process.exit(1);
  }

  try {
    // zstd --train을 사용하여 공통 패턴 추출
    execSync(`zstd --train ${samples} -o ${path.join(OUTPUT_DIR, DICT_NAME)} --maxdict=${DICT_SIZE}`);
    console.log(`사전 생성 완료: ${DICT_NAME}`);
  } catch (err) {
    console.error('사전 훈련 실패. zstd가 설치되지 않았거나 권한 문제가 있을 수 있습니다.');
    console.error(err.message);
    process.exit(1);
  }
}

/**
 * 3. 통합 VFS 바이너리 생성
 * Tar로 묶은 후, 앞서 생성한 사전을 적용하여 압축합니다.
 */
function createCompressedBundle() {
  console.log('--- [2/3] 통합 VFS 번들링 및 압축 시작 ---');

  const dictPath = path.join(OUTPUT_DIR, DICT_NAME);
  const vfsPath = path.join(OUTPUT_DIR, VFS_NAME);

  // 불필요한 파일 제외 (테스트 파일, 문서, 기본 테마 등)
  const excludeList = [
    '*.git*',
    'node_modules',
    '*.txt',
    '*.md',
    '*.log',
    '*.json', // 설정 파일은 D1으로 관리
    'wp-content/themes/twenty*', // 기본 테마 제외
    'wp-content/plugins/akismet*', // 기본 플러그인 제외
    'wp-content/plugins/hello.php' // 기본 플러그인 제외
  ].map(pattern => `--exclude='${pattern}'`).join(' ');

  try {
    // tar로 묶어 파이프로 넘긴 뒤 zstd로 압축 (-19 설정으로 압축률 극대화)
    const buildCmd = `tar -cf - ${excludeList} ${WP_CORE_PATH} ${PLUGINS_PATH} ${THEMES_PATH} | zstd -19 -D ${dictPath} -o ${vfsPath}`;
    execSync(buildCmd, { stdio: 'inherit' }); // 진행 상황을 콘솔에 출력
    
    const stats = fs.statSync(vfsPath);
    console.log(`통합 VFS 생성 완료: ${VFS_NAME} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error('번들링 실패:', err);
    console.error(err.message);
    process.exit(1);
  }
}

/**
 * 4. 결과 보고
 */
function report() {
  console.log('--- [3/3] 빌드 완료 ---');
  console.log(`결과물 위치: ${OUTPUT_DIR}`);
  console.log(`Worker 로드 팁: Cloudflare KV에 '${DICT_NAME}'과 '${VFS_NAME}'을 업로드하여 사용하세요.`);
}

// 실행
trainDictionary();
createCompressedBundle();
report();
