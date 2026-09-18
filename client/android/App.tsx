import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import { fetchCards, type CardsResponse } from "./src/api";

/**
 * Phase 1時点では「サーバーからCard Masterを取得して表示するだけ」の疎通確認画面。
 * Web版(client/web/src/App.tsx)と同じ@tcg/sharedの型・同じAPIを使用する。
 * ゲーム画面本体はPhase 4以降で実装する。
 */
export default function App() {
  const [data, setData] = useState<CardsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>オンライン対戦カードゲーム（Phase 1 疎通確認）</Text>
        {error && <Text style={styles.error}>エラー: {error}</Text>}
        {!data && !error && <Text>Card Masterを読み込み中...</Text>}
        {data && (
          <>
            <Text style={styles.heading}>カード一覧（{data.cards.length}件）</Text>
            {data.cards.map((card) => (
              <Text key={card.cardId}>
                [{card.cardType}] {card.cardId} - {card.name}
              </Text>
            ))}
            <Text style={styles.heading}>Player Master一覧（{data.players.length}件）</Text>
            {data.players.map((player) => (
              <Text key={player.playerId}>
                {player.playerId} - {player.name}（HP: {player.health}）
              </Text>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  error: { color: "red" },
});
