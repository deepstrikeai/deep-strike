import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { C, FONT } from './src/theme';

import HomeScreen from './src/screens/HomeScreen';
import CommanderScreen from './src/screens/CommanderScreen';
import PlacementScreen from './src/screens/PlacementScreen';
import BattleScreen from './src/screens/BattleScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import MultiplayerBattleScreen from './src/screens/MultiplayerBattleScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import DailyScreen from './src/screens/DailyScreen';
import DailyResultScreen from './src/screens/DailyResultScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ReplayScreen from './src/screens/ReplayScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StoreScreen from './src/screens/StoreScreen';
import CampaignScreen from './src/screens/CampaignScreen';
import CampaignBattleScreen from './src/screens/CampaignBattleScreen';
import BattlePassScreen from './src/screens/BattlePassScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsScreen from './src/screens/TermsScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { isOnboardingDone } from './src/services/onboardingService';
import { GAME_PHASE, GAME_MODES } from './src/constants/gameConstants';
import { submitPlacement, listenToGame } from './src/services/gameService';
import { isPremiumUnlocked, getOrCreatePlayerId } from './src/services/premiumService';
import { addCommanderXP } from './src/services/commanderService';
import { getActiveTheme } from './src/services/themeService';
import { getVoiceOnlyMode } from './src/services/settingsService';
import { saveMissionResult } from './src/services/campaignService';
import { addBattlePassXP } from './src/services/battlePassService';
import { incrementStat } from './src/services/challengeService';
import { getDailySeed, buildDailyFleet, saveDailyRecord, getDailyRecord } from './src/utils/dailyChallenge';
import ErrorBoundary from './src/components/ErrorBoundary';
import * as Notifications from 'expo-notifications';
import { initSentry, setUser as setSentryUser } from './src/services/sentryService';
import { initAnalytics, track, EVENTS } from './src/services/analyticsService';
import { initAds } from './src/services/adService';
import { requestATT } from './src/services/attService';
import { requestConsent } from './src/services/consentService';

// Init Sentry before the component tree mounts
initSentry();
// EU consent (UMP) + iOS ATT in parallel, then load ads
Promise.all([requestConsent(), requestATT()]).then(() => initAds());

export default function App() {
  // Single-player state
  const [phase, setPhase] = useState(GAME_PHASE.MENU);
  const [commander, setCommander] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [playerShipGrid, setPlayerShipGrid] = useState(null);
  const [playerPlacements, setPlayerPlacements] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [xpResult, setXpResult] = useState(null);

  // Multiplayer state
  const [roomCode, setRoomCode] = useState(null);
  const [playerNum, setPlayerNum] = useState(null);
  const [mpResult, setMpResult] = useState(null);
  const [gameMode, setGameMode] = useState(GAME_MODES.CLASSIC);
  const [pushToken, setPushToken] = useState(null);
  const unsubRef = useRef(null);

  // Premium & identity
  const [isPremium, setIsPremium] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gridTheme, setGridTheme] = useState(null);
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false);
  const prePaywallPhaseRef = useRef(GAME_PHASE.MENU);

  // Daily challenge
  const [dailyFleet, setDailyFleet] = useState(null);
  const [dailyShots, setDailyShots] = useState(null);
  const [dailyRecord, setDailyRecord] = useState(null);

  // Campaign
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [activeMission,  setActiveMission]  = useState(null);

  useEffect(() => {
    isPremiumUnlocked().then(val => setIsPremium(val));
    getOrCreatePlayerId().then(id => {
      setMyPlayerId(id);
      setSentryUser(id);
      initAnalytics(id);
    });
    getActiveTheme().then(t => setGridTheme(t));
    getVoiceOnlyMode().then(v => setVoiceOnlyMode(v));
    isOnboardingDone().then(done => { if (!done) setShowOnboarding(true); });
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const code = response.notification.request.content.data?.roomCode;
      if (code && code === roomCode) setPhase('mp_battle');
    });
    return () => {
      sub.remove();
      unsubRef.current?.();
    };
  }, [roomCode]);

  // ── Single-player handlers ──
  const handleStart = useCallback((mode = GAME_MODES.CLASSIC) => {
    if (mode === GAME_MODES.DAILY) {
      if (!isPremium) {
        prePaywallPhaseRef.current = GAME_PHASE.MENU;
        track(EVENTS.PAYWALL_SHOWN, { source: 'daily' });
        setPhase('paywall');
        return;
      }
      const seed = getDailySeed();
      const fleet = buildDailyFleet(seed);
      setDailyFleet(fleet);
      getDailyRecord(seed).then(rec => setDailyRecord(rec));
      setPhase('daily');
      return;
    }
    if (mode === GAME_MODES.SALVO && !isPremium) {
      prePaywallPhaseRef.current = GAME_PHASE.MENU;
      track(EVENTS.PAYWALL_SHOWN, { source: 'salvo' });
      setPhase('paywall');
      return;
    }
    setGameMode(mode);
    setPhase('commander');
  }, [isPremium]);

  const handleCommanderSelect = useCallback((cmd, diff) => {
    setCommander(cmd);
    setDifficulty(diff);
    track(EVENTS.COMMANDER_SELECTED, { commanderId: cmd?.id, isPremium });
    setPhase(GAME_PHASE.PLACEMENT);
  }, [isPremium]);

  const handlePlacementBack = useCallback(() => setPhase('commander'), []);

  const handlePlacementReady = useCallback((grid, placements) => {
    setPlayerShipGrid(grid);
    setPlayerPlacements(placements);
    track(EVENTS.GAME_START, { mode: gameMode, commander: commander?.id, difficulty });
    setPhase(GAME_PHASE.BATTLE);
  }, [gameMode, commander, difficulty]);

  const handleGameOver = useCallback((result) => {
    setGameResult(result);
    track(EVENTS.GAME_END, { mode: gameMode, winner: result.winner, commander: commander?.id });
    setPhase(GAME_PHASE.GAME_OVER);
    // Award XP to the selected commander + Battle Pass
    const bpXP = result.winner === 'player' ? 100 : 40;
    addBattlePassXP(bpXP).catch(() => {});
    // Increment challenge stats
    incrementStat('games').catch(() => {});
    if (result.winner === 'player') {
      incrementStat('wins').catch(() => {});
      incrementStat('win_streak').catch(() => {});
    } else {
      incrementStat('loss').catch(() => {});
    }
    if (commander?.id) {
      const xpEarned = result.winner === 'player' ? 50 : 15;
      addCommanderXP(commander.id, xpEarned)
        .then(res => setXpResult({ xpEarned, ...res }))
        .catch(() => {});
    }
  }, [commander, gameMode]);

  const handlePlayAgain = useCallback(() => {
    setPlayerShipGrid(null);
    setPlayerPlacements(null);
    setGameResult(null);
    setXpResult(null);
    setPhase(GAME_PHASE.PLACEMENT);
  }, []);

  const handleHome = useCallback(() => {
    setCommander(null);
    setPlayerShipGrid(null);
    setPlayerPlacements(null);
    setGameResult(null);
    setXpResult(null);
    setPhase(GAME_PHASE.MENU);
  }, []);

  // ── Premium handlers ──
  const goToPaywall = useCallback((source) => {
    track(EVENTS.PAYWALL_SHOWN, { source });
    setPhase('paywall');
  }, []);

  const handleUnlock = useCallback(() => {
    setIsPremium(true);
    setPhase(prePaywallPhaseRef.current || GAME_PHASE.MENU);
  }, []);

  const handlePaywallBack = useCallback(() => {
    setPhase(prePaywallPhaseRef.current || GAME_PHASE.MENU);
  }, []);

  // ── Daily challenge handlers ──
  const handleDailyComplete = useCallback(async (shots) => {
    const seed = getDailySeed();
    const rec = await saveDailyRecord(seed, shots);
    track(EVENTS.DAILY_COMPLETED, { shots, stars: rec?.stars });
    setDailyShots(shots);
    setPhase('daily_result');
  }, []);

  // ── Campaign handlers ──
  const handleCampaignMissionSelect = useCallback((campaign, mission) => {
    setActiveCampaign(campaign);
    setActiveMission(mission);
    setPhase('campaign_battle');
  }, []);

  const handleCampaignComplete = useCallback(async (campaignId, missionId, stars, shots) => {
    await saveMissionResult(campaignId, missionId, stars, shots);
    incrementStat('missions').catch(() => {});
    addBattlePassXP(stars * 50).catch(() => {});
    track(EVENTS.CAMPAIGN_COMPLETED, { campaignId, missionId, stars, shots });
    setPhase('campaign');
  }, []);

  // ── Settings handlers ──
  const handleAccountDeleted = useCallback(() => {
    // Clear app state and return to home
    setIsPremium(false);
    setMyPlayerId(null);
    setPhase(GAME_PHASE.MENU);
  }, []);

  // ── Multiplayer handlers ──
  const handleMultiplayer = useCallback((mode = GAME_MODES.CLASSIC) => {
    if (!isPremium) {
      prePaywallPhaseRef.current = GAME_PHASE.MENU;
      track(EVENTS.PAYWALL_SHOWN, { source: 'multiplayer' });
      setPhase('paywall');
      return;
    }
    setGameMode(mode);
    setPhase('lobby');
  }, [isPremium]);

  const handleGameReady = useCallback(({ roomCode: code, playerNum: num, gameMode: gm, pushToken: pt }) => {
    setRoomCode(code);
    setPlayerNum(num);
    if (gm) setGameMode(gm);
    if (pt) setPushToken(pt);
    setPhase('mp_commander');
  }, []);

  const handleMpCommanderSelect = useCallback((cmd) => {
    setCommander(cmd);
    setPhase('mp_placement');
  }, []);

  const handleMpPlacementBack = useCallback(() => setPhase('mp_commander'), []);

  const handleMpWaitingCancel = useCallback(() => {
    unsubRef.current?.();
    setRoomCode(null);
    setPlayerNum(null);
    setPhase('lobby');
  }, []);

  const handleMpPlacementReady = useCallback(async (grid, placements) => {
    setPhase('mp_waiting');
    // Set up the listener BEFORE submitting so we never miss the 'battle' status update,
    // even if submitPlacement resolves after Firestore fires the snapshot.
    unsubRef.current?.();
    unsubRef.current = listenToGame(roomCode, (data) => {
      if (data.status === 'battle') {
        unsubRef.current?.();
        setPhase('mp_battle');
      }
    });
    try {
      await submitPlacement(roomCode, playerNum, grid, placements, commander?.id, pushToken, myPlayerId);
    } catch (e) {
      unsubRef.current?.();
      setPhase('mp_placement');
    }
  }, [roomCode, playerNum, commander, pushToken, myPlayerId]);

  const handleMpGameOver = useCallback((result) => {
    unsubRef.current?.();
    setMpResult(result);
    setPhase('mp_game_over');
  }, []);

  const handleMpPlayAgain = useCallback(() => {
    setRoomCode(null);
    setPlayerNum(null);
    setMpResult(null);
    setCommander(null);
    setPushToken(null);
    setPhase('lobby');
  }, []);

  const handleMpHome = useCallback(() => {
    unsubRef.current?.();
    setRoomCode(null);
    setPlayerNum(null);
    setMpResult(null);
    setCommander(null);
    setPushToken(null);
    setPhase(GAME_PHASE.MENU);
  }, []);

  const renderScreen = () => {
    switch (phase) {
      case GAME_PHASE.MENU:
        return (
          <HomeScreen
            onStart={handleStart}
            onMultiplayer={handleMultiplayer}
            onLeaderboard={() => setPhase('leaderboard')}
            onSettings={() => setPhase('settings')}
            onStore={() => setPhase('store')}
            onCampaign={() => setPhase('campaign')}
            onBattlePass={() => setPhase('battlepass')}
            onChallenges={() => setPhase('challenges')}
            isPremium={isPremium}
          />
        );
      case 'commander':
        return (
          <CommanderScreen
            onSelect={handleCommanderSelect}
            onBack={handleHome}
            onPaywall={() => { prePaywallPhaseRef.current = 'commander'; goToPaywall('commander'); }}
            isPremium={isPremium}
          />
        );
      case GAME_PHASE.PLACEMENT:
        return <PlacementScreen onReady={handlePlacementReady} onBack={handlePlacementBack} commander={commander} />;
      case GAME_PHASE.BATTLE:
        return (
          <BattleScreen
            playerShipGrid={playerShipGrid}
            playerPlacements={playerPlacements}
            commander={commander}
            difficulty={difficulty}
            gameMode={gameMode}
            gridTheme={gridTheme}
            voiceOnlyMode={voiceOnlyMode}
            onGameOver={handleGameOver}
            onQuit={handleHome}
          />
        );
      case GAME_PHASE.GAME_OVER:
        return (
          <GameOverScreen
            result={gameResult}
            commander={commander}
            xpResult={xpResult}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        );

      // ── Premium / Paywall ──
      case 'paywall':
        return <PaywallScreen onUnlock={handleUnlock} onBack={handlePaywallBack} />;

      // ── Daily Challenge ──
      case 'daily':
        if (!dailyFleet) return null;
        return (
          <DailyScreen
            dailyFleet={dailyFleet}
            onComplete={handleDailyComplete}
            onQuit={handleHome}
          />
        );
      case 'daily_result':
        return (
          <DailyResultScreen
            shots={dailyShots}
            previousBest={dailyRecord?.bestShots}
            isFirstAttempt={!dailyRecord?.completed}
            onHome={handleHome}
          />
        );

      // ── Leaderboard ──
      case 'leaderboard':
        return <LeaderboardScreen myPlayerId={myPlayerId} onBack={handleHome} />;

      // ── Store ──
      case 'store':
        return (
          <StoreScreen
            onBack={handleHome}
            onPaywall={() => { prePaywallPhaseRef.current = 'store'; goToPaywall('store'); }}
            isPremium={isPremium}
          />
        );

      // ── Challenges ──
      case 'challenges':
        return <ChallengesScreen onBack={handleHome} />;

      // ── Battle Pass ──
      case 'battlepass':
        return (
          <BattlePassScreen
            onBack={handleHome}
            isPremium={isPremium}
          />
        );

      // ── Campaign ──
      case 'campaign':
        return (
          <CampaignScreen
            onSelectMission={handleCampaignMissionSelect}
            onBack={handleHome}
            isPremium={isPremium}
          />
        );
      case 'campaign_battle':
        if (!activeCampaign || !activeMission) return null;
        return (
          <CampaignBattleScreen
            campaign={activeCampaign}
            mission={activeMission}
            onComplete={handleCampaignComplete}
            onQuit={() => setPhase('campaign')}
          />
        );

      // ── Replay ──
      case 'replay':
        return <ReplayScreen roomCode={roomCode} onBack={() => setPhase('mp_game_over')} />;

      // ── Settings ──
      case 'settings':
        return (
          <SettingsScreen
            onBack={handleHome}
            onPrivacy={() => setPhase('privacy_policy')}
            onTerms={() => setPhase('terms')}
            onDeleteAccount={() => setPhase('delete_account')}
            onPaywall={() => { prePaywallPhaseRef.current = 'settings'; goToPaywall('settings'); }}
            onThemeChange={t => setGridTheme(t)}
            onVoiceOnlyChange={v => setVoiceOnlyMode(v)}
            isPremium={isPremium}
            myPlayerId={myPlayerId}
          />
        );
      case 'privacy_policy':
        return <PrivacyPolicyScreen onBack={() => setPhase('settings')} />;
      case 'terms':
        return <TermsScreen onBack={() => setPhase('settings')} />;
      case 'delete_account':
        return <DeleteAccountScreen onDeleted={handleAccountDeleted} onBack={() => setPhase('settings')} />;

      // ── Multiplayer phases ──
      case 'lobby':
        return <LobbyScreen onGameReady={handleGameReady} onBack={handleHome} gameMode={gameMode} />;
      case 'mp_commander':
        return (
          <CommanderScreen
            mpMode
            isPremium={isPremium}
            onSelect={handleMpCommanderSelect}
            onBack={() => setPhase('lobby')}
          />
        );
      case 'mp_placement':
        return (
          <PlacementScreen
            onReady={handleMpPlacementReady}
            onBack={handleMpPlacementBack}
            commander={null}
            headerOverride={`Player ${playerNum} — Deploy Your Fleet`}
          />
        );
      case 'mp_waiting':
        return (
          <SafeAreaView style={styles.waitContainer}>
            <ActivityIndicator color="#4FC3F7" size="large" />
            <Text style={styles.waitText}>Waiting for opponent to place ships...</Text>
            <Text style={styles.waitRoom}>Room: {roomCode}</Text>
            <TouchableOpacity onPress={handleMpWaitingCancel} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>✕  CANCEL</Text>
            </TouchableOpacity>
          </SafeAreaView>
        );
      case 'mp_battle':
        return (
          <MultiplayerBattleScreen
            roomCode={roomCode}
            playerNum={playerNum}
            myPlayerId={myPlayerId}
            onGameOver={handleMpGameOver}
            onQuit={handleMpHome}
            commander={commander}
          />
        );
      case 'mp_game_over':
        return (
          <SafeAreaView style={[styles.root, mpResult?.winner === playerNum ? styles.winBg : styles.loseBg]}>
            <ScrollView contentContainerStyle={styles.mpGameOverScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.gameOverEmoji}>{mpResult?.winner === playerNum ? '🏆' : '💀'}</Text>
              <Text style={[styles.gameOverTitle, mpResult?.winner !== playerNum && { color: C.RED }]}>{mpResult?.winner === playerNum ? 'VICTORY' : 'MISSION FAILED'}</Text>
              <Text style={styles.gameOverSub}>
                {mpResult?.winner === playerNum ? 'You sunk the enemy fleet!' : 'Your fleet was destroyed!'}
              </Text>
              <View style={styles.gameOverBtns}>
                <TouchableOpacity style={styles.gameOverBtn} onPress={handleMpPlayAgain}>
                  <Text style={styles.gameOverBtnText}>⚔️ Play Again</Text>
                </TouchableOpacity>
                {roomCode && (
                  <TouchableOpacity style={styles.gameOverBtn} onPress={() => setPhase('replay')}>
                    <Text style={styles.gameOverBtnText}>📽  Watch Replay</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleMpHome}>
                  <Text style={styles.gameOverBtnSecondary}>🏠 Main Menu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      default:
        return <HomeScreen onStart={handleStart} onMultiplayer={handleMultiplayer} isPremium={isPremium} />;
    }
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        {renderScreen()}
        {showOnboarding && (
          <View style={StyleSheet.absoluteFill}>
            <OnboardingScreen onDone={() => setShowOnboarding(false)} />
          </View>
        )}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  waitContainer: { flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  waitText: { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, textAlign: 'center', letterSpacing: 2 },
  waitRoom: { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 2 },
  winBg:  { backgroundColor: C.BG },
  loseBg: { backgroundColor: C.BG },
  gameOverEmoji: { fontSize: 64 },
  gameOverTitle: { fontSize: 36, fontWeight: '900', color: C.GREEN, letterSpacing: 6 },
  gameOverSub: { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, textAlign: 'center', letterSpacing: 2 },
  gameOverBtns: { gap: 12, marginTop: 20, alignItems: 'center', width: '100%' },
  gameOverBtn: { borderWidth: 1, borderColor: C.CYAN, paddingVertical: 16, alignItems: 'center', width: '100%', backgroundColor: C.CYAN_DIM },
  gameOverBtnText: { fontFamily: FONT.MONO, fontSize: 13, color: C.CYAN, letterSpacing: 3 },
  gameOverBtnSecondary: { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },
  mpGameOverScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  cancelBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText: { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },
});
