module.exports = {
  apps: [
    {
      name: 'game-ve',
      script: 'node',
      args: 'scripts/next-runner.mjs start',
      cwd: '/root/home/GameVerse',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        // 只在运行时设置的话，普通 pm2 restart 会静默退回 off，下载落地页随即失效，因此固化到 ecosystem。
        DOWNLOAD_LANDING_MODE: 'external',
      },
      out_file: '/root/.pm2/logs/game-ve-out.log',
      error_file: '/root/.pm2/logs/game-ve-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
