# Google Drive共有権限付け替え処理

DriveCheckerから出力したCSVファイルを読み込んで、フォルダに付いている権限を引き剥がし&その下にあるファイルに付け替えるスクリプトです。
GASで実行する前提で記述しています。

importCSVから実行してください。

importCSV(CSVデータの読み込み)→
getChildFileLastUpdate(フォルダ内にある最終更新ファイルの取得)→
getTargetFolders(対象フォルダの抽出)→
executeFolerPermission(フォルダ権限引き剥がし&付け直し)

の順で実行されます。
