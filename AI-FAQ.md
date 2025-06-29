# AI-FAQ.md

AIエージェント必読文書 - 20分以上かかった問題の解決方法

## TypeScript関連

Q: strict: falseでエラーが隠されている場合の対処法は？
A: tsconfig.jsonのstrict設定を確認し、--strictオプションで実際のエラーを確認する。段階的に修正してstrict: trueに移行する。

Q: Property has no initializer and is not definitely assigned in the constructor エラーの対処法は？
A: コンストラクタで初期化するか、プロパティに!を付けて確実に代入されることを示すか、初期値を設定する。

Q: Object is possibly 'undefined' エラーの対処法は？
A: オプショナルチェイニング(?.)やnull合体演算子(??)を使用するか、型ガードで事前チェックを行う。

Q: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type エラーの対処法は？
A: Record<string, string>などの適切な型定義を追加するか、型アサーションを使用する。

Q: Type 'unknown' is not assignable to parameter of type 'Error' エラーの対処法は？
A: catch句でerror as Errorまたはerror as anyを使用して型アサーションを行う。

Q: Argument of type 'string | undefined' is not assignable to parameter of type 'string' エラーの対処法は？
A: 型ガード（if文）を使用してundefinedをチェックしてから使用する。
