import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import firestoreService from '../services/firestore';
import { analyzeReceiptBase64 } from '../services/receiptAI';
import { ReceiptInput } from '../types';

export default function CaptureReceiptScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [extract, setExtract] = useState<ReceiptInput | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Precisamos da câmera para capturar o cupom.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setImage(a.uri);
      if (a.base64) await runExtract(a.base64);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Precisamos do acesso à galeria.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setImage(a.uri);
      if (a.base64) await runExtract(a.base64);
    }
  };

  const runExtract = async (base64: string) => {
    setLoading(true);
    setExtract(null);
    try {
      const data = await analyzeReceiptBase64(base64);
      setExtract(data);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível extrair os dados do cupom.');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!extract) return;
    setLoading(true);
    try {
      await firestoreService.addReceipt(extract);
      Alert.alert('Sucesso', 'Registro salvo no Firestore.');
      setImage(null);
      setExtract(null);
      // Navega para a aba de registros após salvar
      router.push('/(tabs)/receipts');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Captura de Cupom</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonTxt}>Fotografar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.alt]} onPress={pickFromGallery}>
          <Text style={styles.buttonTxt}>Galeria</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <Image source={{ uri: image }} style={styles.preview} resizeMode="contain" />)
      }

      {loading && (
        <View style={styles.loading}> 
          <ActivityIndicator />
          <Text style={styles.loadingTxt}>Processando imagem…</Text>
        </View>
      )}

      {extract && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados extraídos</Text>
          <Text>Estabelecimento: {extract.merchant}</Text>
          <Text>Valor total: R$ {extract.total.toFixed(2)}</Text>
          <Text>Data/Hora: {new Date(extract.dateTime).toLocaleString()}</Text>
          <Text>Categoria: {extract.category}</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={save}>
            <Text style={styles.buttonTxt}>Salvar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#4285F4', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  alt: { backgroundColor: '#5CA0FF' },
  buttonTxt: { color: '#fff', fontWeight: '700' },
  preview: { width: '100%', height: 280, marginVertical: 12, borderRadius: 8, backgroundColor: '#eee' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingTxt: { fontSize: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginTop: 12, gap: 6 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
});
