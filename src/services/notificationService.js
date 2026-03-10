import * as Notifications from 'expo-notifications';

export const requestPushToken = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
};

export const sendTurnNotification = async (opponentToken, roomCode) => {
  if (!opponentToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: opponentToken,
      title: 'Your Turn — Deep Strike',
      body: 'Your opponent fired. Tap to respond.',
      data: { roomCode },
    }),
  });
};
