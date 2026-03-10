import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { C, FONT } from '../theme';
import { captureException } from '../services/sentryService';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    captureException(error, { componentStack: errorInfo?.componentStack });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={s.root}>
          <View style={s.content}>
            <Text style={s.icon}>⚠️</Text>
            <Text style={s.title}>SYSTEM ERROR</Text>
            <Text style={s.message}>
              The app encountered an unexpected error and couldn't continue.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}
            <TouchableOpacity onPress={this.handleReload} style={s.btn} activeOpacity={0.8}>
              <Text style={s.btnText}>🔄  RELOAD APP</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.BG, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content:  { alignItems: 'center', gap: 16 },
  icon:     { fontSize: 64 },
  title:    { fontFamily: FONT.MONO, fontSize: 20, fontWeight: '900', color: C.RED, letterSpacing: 4 },
  message:  { fontSize: 14, color: C.TEXT_DIM, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  errorBox: { borderWidth: 1, borderColor: 'rgba(255,43,43,0.3)', backgroundColor: 'rgba(255,43,43,0.05)', padding: 12, width: '100%', marginTop: 8 },
  errorText:{ fontFamily: FONT.MONO, fontSize: 10, color: C.RED },
  btn:      { borderWidth: 1, borderColor: C.CYAN, paddingVertical: 16, paddingHorizontal: 32, marginTop: 16 },
  btnText:  { fontFamily: FONT.MONO, fontSize: 13, color: C.CYAN, letterSpacing: 3 },
});
