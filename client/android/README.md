# client/android

React Native (Expo SDK 57) + TypeScript。`shared/` の型・定数をWebと共通で使用する。

## 開発時の起動

```
npm install    # プロジェクトルートで実行（workspaces）
cd client/android
npx expo start
```

## APKビルド

`.github/workflows/android-build.yml` によりGitHub Actions上で `expo prebuild` → Gradle `assembleDebug` を実行し、動作確認用の未署名Debug APKをArtifactとして出力する。Google Playへのリリース用署名付きAPK/AABの作成は、実際にリリースする段階で別途相談する（署名鍵の管理方法を決める必要があるため）。

## 確認・変更が必要な項目

- `app.json` の `android.package`（現在は仮の値 `com.example.onlinetcg`）を実際に使用するパッケージ名に変更する。
- アプリアイコン・スプラッシュ画像（`assets/`配下）は未作成。デザインが決まり次第追加する。
