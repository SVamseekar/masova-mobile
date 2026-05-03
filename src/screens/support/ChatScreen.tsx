/**
 * MaSoVa AI Support Chat Screen
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography, colors } from '../../styles';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

interface ChatResponse {
  reply: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_BASE = (() => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
})();

const SESSION_STORAGE_KEY = 'masova_chat_session_id';

const WELCOME: Message = {
  id: 'welcome',
  role: 'agent',
  text: "Hi! I'm MaSoVa's support assistant. I can help with order status, menu questions, complaints, and refunds. How can I help you today?",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const ChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = useRef<string | null>(null);
  const listRef = useRef<FlatList>(null);

  // Load or create session ID
  useEffect(() => {
    AsyncStorage.getItem(SESSION_STORAGE_KEY).then((stored) => {
      if (stored) {
        sessionId.current = stored;
      } else {
        const newId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionId.current = newId;
        AsyncStorage.setItem(SESSION_STORAGE_KEY, newId);
      }
    });
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();
    setLoading(true);

    try {
      const body: Record<string, string> = {
        message: text,
        sessionId: sessionId.current ?? '',
      };
      if (user?.id) body.customerId = user.id;

      const response = await axios.post<ChatResponse>(`${AGENT_BASE}/agent/chat`, body);
      const data = response.data;

      // Persist updated sessionId
      if (data.sessionId && data.sessionId !== sessionId.current) {
        sessionId.current = data.sessionId;
        AsyncStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'agent', text: data.reply },
      ]);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'agent',
          text: "Sorry, I'm having trouble connecting right now. Please try again or email support@masova.com.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, user]);

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAgent]}>
        {!isUser && (
          <View style={[styles.agentAvatar, { backgroundColor: '#FFD000' }]}>
            <Text style={styles.agentAvatarText}>M</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: '#FFD000' }]
              : [styles.bubbleAgent, { backgroundColor: theme.colors.surface2 }],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? '#000000' : theme.colors.text1 },
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom + 60}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + spacing[2], backgroundColor: '#FFD000' }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>M</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>MaSoVa Support</Text>
            <Text style={styles.headerSubtitle}>AI assistant · usually instant</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={[styles.typingRow, { backgroundColor: theme.colors.bg }]}>
          <View style={[styles.agentAvatar, { backgroundColor: '#FFD000' }]}>
            <Text style={styles.agentAvatarText}>M</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleAgent, { backgroundColor: theme.colors.surface2 }]}>
            <ActivityIndicator size="small" color={'#FFD000'} />
          </View>
        </View>
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: insets.bottom + spacing[2],
            backgroundColor: theme.colors.surface1,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor={theme.colors.text3}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface2,
              color: theme.colors.text1,
            },
          ]}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={loading || !input.trim()}
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !loading ? '#FFD000' : theme.colors.border },
          ]}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fff',
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.fontSize.caption,
  },
  messageList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing[3],
  },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAgent: { justifyContent: 'flex-start' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  agentAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '78%',
    padding: spacing[3],
  },
  bubbleUser: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleAgent: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: typography.fontSize.body,
    lineHeight: 22,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  input: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.body,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ChatScreen;
