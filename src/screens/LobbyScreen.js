import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createGame, joinGame, listenToGame, findOpponent, cancelMatchmaking, listenToMatchmaking } from '../services/gameService';
import { requestPushToken } from '../services/notificationService';
import { C, FONT, GLOW } from '../theme';
import { GAME_MODES } from '../constants/gameConstants';

const generatePlayerId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function LobbyScreen({ onGameReady, onBack, gameMode = GAME_MODES.CLASSIC }) {
  const [mode,               setMode]              = useState(null);
  const [roomCode,           setRoomCode]          = useState('');
  const [inputCode,          setInputCode]         = useState('');
  const [loading,            setLoading]           = useState(false);
  const [error,              setError]             = useState('');
  const [waitingForOpponent, setWaitingForOpponent]= useState(false);
  const [searching,          setSearching]         = useState(false);
  const [pushToken,          setPushToken]         = useState(null);
  const playerIdRef = useRef(generatePlayerId());
  const unsubRef    = useRef(null);

  useEffect(() => {
    requestPushToken().then(t => { if (t) setPushToken(t); }).catch(() => {});
    return () => unsubRef.current?.();
  }, []);

  const handleCreate = async () => {
    setLoading(true); setError('');
    try {
      const code = await createGame(gameMode);
      setRoomCode(code);
      setMode('create');
      setWaitingForOpponent(true);
      unsubRef.current = listenToGame(code, data => {
        if (data.status === 'placing') {
          unsubRef.current?.();
          onGameReady({ roomCode: code, playerNum: 1, gameMode, pushToken });
        }
      });
    } catch (e) { console.error('createGame failed:', e); setError('Failed to create. Check your connection.'); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (inputCode.length < 4) { setError('Enter the room code'); return; }
    setLoading(true); setError('');
    try {
      const code = await joinGame(inputCode);
      onGameReady({ roomCode: code, playerNum: 2, gameMode, pushToken });
    } catch (e) { console.error('joinGame failed:', e); setError(e.message || 'Could not join. Check the code.'); }
    setLoading(false);
  };

  const handleFindOpponent = async () => {
    setSearching(true); setError('');
    try {
      const result = await findOpponent(playerIdRef.current, gameMode);
      if (result.action === 'matched') {
        // We are Player 2 — proceed immediately
        onGameReady({ roomCode: result.roomCode, playerNum: 2, gameMode: result.gameMode || gameMode, pushToken });
        return;
      }
      // We are Player 1 — wait for match on our own document
      unsubRef.current = listenToMatchmaking(playerIdRef.current, data => {
        if (data.status === 'matched' && data.roomCode) {
          unsubRef.current?.();
          onGameReady({ roomCode: data.roomCode, playerNum: 1, gameMode: data.gameMode || gameMode, pushToken });
        }
      });
    } catch (e) {
      console.error('findOpponent failed:', e);
      setError('Matchmaking error. Try again.');
      setSearching(false);
    }
  };

  const handleCancelSearch = async () => {
    unsubRef.current?.();
    await cancelMatchmaking(playerIdRef.current).catch(() => {});
    setSearching(false);
    setError('');
  };

  const shareCode = () => Share.share({ message: `Join my Deep Strike naval battle! Code: ${roomCode}` });

  if (searching) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.waitScreen}>
          <View style={s.waitHeader}>
            <View style={s.headerLine} /><Text style={s.headerText}>MATCHMAKING</Text><View style={s.headerLine} />
          </View>
          <Text style={s.waitSub}>SEARCHING FOR AN OPPONENT...</Text>
          <View style={[s.codeBox, { borderColor: C.AMBER_BORDER }]}>
            <LinearGradient colors={['rgba(255,179,0,0.12)', 'rgba(255,179,0,0.04)']} style={StyleSheet.absoluteFill} />
            <ActivityIndicator color="#FFB300" size="large" style={{ marginBottom: 10 }} />
            <Text style={[s.codeText, { fontSize: 16, color: '#FFB300' }]}>SEARCHING...</Text>
          </View>
          <TouchableOpacity onPress={handleCancelSearch} style={s.cancelBtn}>
            <Text style={s.cancelText}>✕  CANCEL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (waitingForOpponent) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.waitScreen}>
          <View style={s.waitHeader}>
            <View style={s.headerLine} /><Text style={s.headerText}>GAME CREATED</Text><View style={s.headerLine} />
          </View>
          <Text style={s.waitSub}>SHARE CODE WITH OPPONENT</Text>
          <TouchableOpacity style={[s.codeBox, GLOW.cyan]} onPress={shareCode} activeOpacity={0.8}>
            <LinearGradient colors={['rgba(0,229,255,0.15)', 'rgba(0,229,255,0.05)']} style={StyleSheet.absoluteFill} />
            <Text style={s.codeText}>{roomCode}</Text>
            <Text style={s.codeTap}>TAP TO SHARE</Text>
          </TouchableOpacity>
          <View style={s.waitRow}>
            <ActivityIndicator color={C.CYAN} size="small" />
            <Text style={s.waitingText}>AWAITING OPPONENT...</Text>
          </View>
          <TouchableOpacity onPress={() => { unsubRef.current?.(); onBack(); }} style={s.cancelBtn}>
            <Text style={s.cancelText}>← CANCEL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
      <View style={s.inner}>
        <View style={s.waitHeader}>
          <View style={s.headerLine} /><Text style={s.headerText}>2-PLAYER STRIKE</Text><View style={s.headerLine} />
        </View>
        <Text style={s.waitSub}>BATTLE A FRIEND ON ANOTHER DEVICE</Text>

        {!mode ? (
          <View style={s.btnGroup}>
            <TouchableOpacity style={[s.btnPrimary, GLOW.cyan]} onPress={handleCreate} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(0,229,255,0.2)', 'rgba(0,229,255,0.06)']} style={StyleSheet.absoluteFill} />
              {loading ? <ActivityIndicator color={C.CYAN} /> : <Text style={s.btnPrimaryText}>⚡  CREATE GAME</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setMode('join')} activeOpacity={0.8}>
              <Text style={s.btnSecondaryText}>🔑  JOIN GAME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnMatchmaking} onPress={handleFindOpponent} activeOpacity={0.8}>
              <Text style={s.btnMatchmakingText}>🌐  FIND OPPONENT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.joinForm}>
            <Text style={s.joinLabel}>ENTER ROOM CODE</Text>
            <TextInput
              style={s.input}
              value={inputCode}
              onChangeText={t => setInputCode(t.toUpperCase())}
              placeholder="· · · · · ·"
              placeholderTextColor={C.TEXT_MUTED}
              autoCapitalize="characters"
              maxLength={8}
              autoFocus
            />
            <TouchableOpacity style={[s.btnPrimary, GLOW.cyan]} onPress={handleJoin} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(0,229,255,0.2)', 'rgba(0,229,255,0.06)']} style={StyleSheet.absoluteFill} />
              {loading ? <ActivityIndicator color={C.CYAN} /> : <Text style={s.btnPrimaryText}>JOIN →</Text>}
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  inner:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  waitScreen:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  waitHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, width: '100%' },
  headerLine:   { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:   { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },
  waitSub:      { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 36 },

  codeBox:      { borderWidth: 1, borderColor: C.CYAN, padding: 28, alignItems: 'center', marginBottom: 32, overflow: 'hidden', position: 'relative', width: '100%' },
  codeText:     { fontFamily: FONT.MONO, fontSize: 38, fontWeight: '900', color: C.CYAN, letterSpacing: 12 },
  codeTap:      { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, marginTop: 8, letterSpacing: 2 },
  waitRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  waitingText:  { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, letterSpacing: 2 },
  cancelBtn:    { padding: 14 },
  cancelText:   { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },

  btnGroup:     { width: '100%', gap: 12, marginBottom: 20 },
  btnPrimary:   { borderWidth: 1, borderColor: C.CYAN, padding: 18, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  btnPrimaryText:{ fontFamily: FONT.MONO, fontSize: 13, color: C.CYAN, letterSpacing: 3 },
  btnSecondary: { borderWidth: 1, borderColor: C.GREEN_BORDER, padding: 16, alignItems: 'center', backgroundColor: C.GREEN_DIM },
  btnSecondaryText:{ fontFamily: FONT.MONO, fontSize: 13, color: C.GREEN, letterSpacing: 3 },
  btnMatchmaking:{ borderWidth: 1, borderColor: 'rgba(255,179,0,0.5)', padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,179,0,0.07)' },
  btnMatchmakingText:{ fontFamily: FONT.MONO, fontSize: 13, color: '#FFB300', letterSpacing: 3 },

  joinForm:     { width: '100%', gap: 14 },
  joinLabel:    { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 2, textAlign: 'center' },
  input:        { borderWidth: 1, borderColor: C.BORDER_MED, backgroundColor: C.BG_CARD, padding: 16, fontFamily: FONT.MONO, fontSize: 28, fontWeight: '900', color: C.CYAN, letterSpacing: 10, textAlign: 'center' },

  error:        { fontFamily: FONT.MONO, fontSize: 10, color: C.RED, marginTop: 14, textAlign: 'center', letterSpacing: 1 },
  backBtn:      { marginTop: 28 },
  backText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },
});
