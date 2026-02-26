# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; 

  # 使用 https://search.nixos.org/packages 查找套件
  packages = [
    pkgs.nodejs_20
    pkgs.bun         # 解決 bun command not found
    pkgs.sqlite      # 支援你的 Local SQLite 開發
    pkgs.openssl     # Prisma 運作所需的函式庫
  ];

  # 在工作區中設定環境變數
  env = {
    USE_LOCAL_SQLITE = "true"; # 配合你寫的 Prisma 切換腳本
  };

  idx = {
    # 搜尋擴充功能：https://open-vsx.org/
    extensions = [
      "Prisma.prisma"          # Prisma 語法高亮
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
    ];

    # 啟用預覽
    previews = {
      enable = true;
      previews = {
        web = {
          # 修正 Pipe 順序，將參數帶入 npm run dev
          # 確保 0.0.0.0 讓 IDX 外部能存取，並加上 tee 記錄 log
          command = [
            "sh" 
            "-c" 
            "npm run dev:idx -- --port $PORT --hostname 0.0.0.0"
          ];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };

    # 工作區生命週期鉤子
    workspace = {
      # 第一次建立工作區時執行
      onCreate = {
        npm-install = "npm install";
        # 如果有 Prisma，自動初始化
        prisma-setup = "npx prisma generate";
        default.openFiles = [ ".idx/dev.nix" "package.json" "prisma/schema.prisma" ];
      };
      
      # 每次工作區啟動時執行
      onStart = {
        # 確保每次啟動都檢查一次 Prisma 狀態
        # watch-backend = "npm run dev";
      };
    };
  };
}