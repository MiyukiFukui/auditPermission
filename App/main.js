function replaceFolderPermission() {
  var today = new Date();
  today = Utilities.formatDate(today, "JST", "yyyy/MM/dd");

  //変換したデータとかを書き込むシートを作成(必要ないようであれば削除する)
  var LogSheet = new LogSheet("フォルダ権限引き剝がし実施記録" + today);

  //フォルダの権限引き剝がしで必要な設定情報が書き込まれているシートを読み込み
  var setting = new SettingSheet();

  //出力されたCSVデータをスプレッドシートに書き込み、変換する
  var importData = importCSV(LogSheet);

  //フォルダ内に入っている子ファイルの最終更新日を取得する
  getChildFileLastUpdate(importData, LogSheet);

  //今回のフォルダ権限引き剝がしの対象フォルダ一覧を取得する
  var targetFolders = getTargetFolders(setting, LogSheet);

  //フォルダ権限処理を実行する
  //export(setting);
}
