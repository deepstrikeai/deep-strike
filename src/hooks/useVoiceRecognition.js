import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { parseVoiceCommand } from '../utils/gameLogic';

// onCoordRecognized(coord, text)        — called for single-coord commands (backward compat)
// onCommandRecognized(command, text)    — called for all parsed commands (optional, Phase 4.1+)
export const useVoiceRecognition = (onCoordRecognized, onCommandRecognized) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      // On native: use expo-speech or Voice library
      // For this implementation we simulate with a prompt for demo
      // In production, integrate with @react-native-voice/voice
      
      if (Platform.OS === 'web') {
        // Web Speech API
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            const cmd = parseVoiceCommand(text);
            if (cmd) {
              // Notify extended handler if provided
              onCommandRecognized?.(cmd, text);
              // Backward-compat: notify coord handler for coord commands
              if (cmd.type === 'coord') {
                onCoordRecognized?.(cmd.coord, text);
              } else if (cmd.type === 'multi_coord' && cmd.coords.length > 0) {
                // For multi-coord, fire the first if no extended handler
                if (!onCommandRecognized) onCoordRecognized?.(cmd.coords[0], text);
              }
            } else {
              setError(`Couldn't understand "${text}". Try a grid coordinate (B7), "ability", or "switch".`);
            }
            setIsListening(false);
          };

          recognition.onerror = (event) => {
            setError('Voice recognition error. Please try again or tap a cell.');
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
        } else {
          setError('Voice recognition not supported in this browser.');
          setIsListening(false);
        }
      } else {
        // Native: placeholder - integrate @react-native-voice/voice in production
        // For demo purposes, we'll show a visual indicator
        setTimeout(() => {
          setIsListening(false);
          setError('Voice requires @react-native-voice/voice package. See README for setup.');
        }, 2000);
      }
    } catch (err) {
      setError('Could not start voice recognition.');
      setIsListening(false);
    }
  }, [onCoordRecognized]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, error, startListening, stopListening };
};
