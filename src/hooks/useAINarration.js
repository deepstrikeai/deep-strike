import { useState, useCallback } from 'react';
import { NARRATION_TEMPLATES, AI_SYSTEM_PROMPT, SHIPS } from '../constants/gameConstants';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Replace with your Anthropic API key
const API_KEY = 'YOUR_ANTHROPIC_API_KEY';

const getShipName = (shipId) => SHIPS.find(s => s.id === shipId)?.name || 'ship';

const getRandomTemplate = (templates, shipId) => {
  const t = templates[Math.floor(Math.random() * templates.length)];
  return t.replace('{ship}', getShipName(shipId));
};

export const useAINarration = (commander) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastNarration, setLastNarration] = useState('');

  const getFallbackNarration = useCallback((event, shipId) => {
    switch (event) {
      case 'hit':    return getRandomTemplate(NARRATION_TEMPLATES.hit, shipId);
      case 'miss':   return getRandomTemplate(NARRATION_TEMPLATES.miss, shipId);
      case 'sunk':   return getRandomTemplate(NARRATION_TEMPLATES.sunk, shipId);
      case 'playerHit':  return getRandomTemplate(NARRATION_TEMPLATES.playerHit, shipId);
      case 'playerMiss': return getRandomTemplate(NARRATION_TEMPLATES.playerMiss, shipId);
      case 'playerSunk': return getRandomTemplate(NARRATION_TEMPLATES.playerSunk, shipId);
      default: return '💥 The battle continues!';
    }
  }, []);

  const getCommanderReaction = useCallback((event, shipId) => {
    if (!commander) return '';
    switch (event) {
      case 'hit':  return commander.hitReactions[Math.floor(Math.random() * commander.hitReactions.length)];
      case 'miss': return commander.missReactions[Math.floor(Math.random() * commander.missReactions.length)];
      case 'sunk': return commander.sunkReactions[Math.floor(Math.random() * commander.sunkReactions.length)];
      case 'win':  return commander.winReaction;
      case 'lose': return commander.loseReaction;
      default: return '';
    }
  }, [commander]);

  const getNarration = useCallback(async (event, shipId) => {
    // Always get fallback immediately for responsiveness
    const fallback = getFallbackNarration(event, shipId);
    const reaction = getCommanderReaction(event, shipId);

    // Try Claude API for richer narration if API key is set
    if (API_KEY && API_KEY !== 'YOUR_ANTHROPIC_API_KEY') {
      setIsLoading(true);
      try {
        const shipName = getShipName(shipId);
        const eventDescriptions = {
          hit: `Player just hit the enemy ${shipName}!`,
          miss: `Player just missed — shot hit empty water.`,
          sunk: `Player just sunk the enemy ${shipName}! It's destroyed!`,
          playerHit: `The AI enemy just hit the player's ${shipName}!`,
          playerMiss: `The AI enemy just missed the player's fleet.`,
          playerSunk: `The AI enemy just sunk the player's ${shipName}!`,
        };

        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 80,
            system: AI_SYSTEM_PROMPT(commander?.name || 'Battle Narrator', commander?.personality || 'dramatic naval'),
            messages: [{ role: 'user', content: eventDescriptions[event] || 'Something happened in the battle.' }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.content?.[0]?.text?.trim();
          if (aiText) {
            setLastNarration(aiText);
            setIsLoading(false);
            return { narration: aiText, reaction };
          }
        }
      } catch (e) {
        console.log('API call failed, using fallback narration');
      }
      setIsLoading(false);
    }

    setLastNarration(fallback);
    return { narration: fallback, reaction };
  }, [commander, getFallbackNarration, getCommanderReaction]);

  return { getNarration, isLoading, lastNarration };
};
