import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  Sparkles,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  actionTab?: string;
  actionLabel?: string;
  timestamp: string;
}

interface ChatbotWidgetProps {
  setActiveTab: (tab: string) => void;
}

export default function ChatbotWidget({ setActiveTab }: ChatbotWidgetProps) {
  const { language, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getInitialGreeting = () => {
    if (language === 'hi') {
      return 'नमस्ते! मैं आपका अन्नदाता कृषि सहायक हूँ। मैं आज आपकी क्या सहायता कर सकता हूँ? आप मुझसे फसल रोग पहचान, सिंचाई का सही समय, सरकारी योजनाओं की पात्रता, या मंडी में सीधी बिक्री के बारे में पूछ सकते हैं।';
    }
    if (language === 'pa') {
      return 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਅੰਨਦਾਤਾ ਖੇਤੀ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ? ਤੁਸੀਂ ਮੇਰੇ ਤੋਂ ਫ਼ਸਲ ਰੋਗ ਜਾਂਚ, ਸਿੰਚਾਈ ਦਾ ਸਹੀ ਸਮਾਂ, ਸਰਕਾਰੀ ਸਕੀਮਾਂ, ਮਸ਼ੀਨਰੀ ਕਿਰਾਏ ਜਾਂ ਮੰਡੀ ਵਿੱਚ ਫ਼ਸਲ ਵੇਚਣ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।';
    }
    return 'Hello! I am your annData Agri Assistant. How can I help you today? You can ask me about crop disease diagnosis, irrigation timing, government schemes, renting farm machinery, or direct marketplace selling.';
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      sender: 'bot',
      text: getInitialGreeting(),
      timestamp: 'Just now',
    },
  ]);

  // Update initial greeting if language changes and only initial message is present
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: 'msg-init',
            sender: 'bot',
            text: getInitialGreeting(),
            timestamp: 'Just now',
          },
        ];
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    {
      label: language === 'hi' ? 'रोग की पहचान' : language === 'pa' ? 'ਰੋਗ ਦੀ ਪਛਾਣ' : 'Diagnose Disease',
      query: language === 'hi' ? 'फसल रोग की पहचान कैसे करें?' : language === 'pa' ? 'ਫ਼ਸਲ ਰੋਗ ਦੀ ਪਛਾਣ ਕਿਵੇਂ ਕਰੀਏ?' : 'How do I detect crop leaf disease?',
    },
    {
      label: language === 'hi' ? 'सिंचाई समय' : language === 'pa' ? 'ਸਿੰਚਾਈ ਸਮਾਂ' : 'Check Irrigation',
      query: language === 'hi' ? 'सिंचाई का सही समय कैसे जांचें?' : language === 'pa' ? 'ਸਿੰਚਾਈ ਦਾ ਸਹੀ ਸਮਾਂ ਕਿਵੇਂ ਦੇਖੀਏ?' : 'When should I irrigate my field?',
    },
    {
      label: language === 'hi' ? 'सरकारी योजनाएं' : language === 'pa' ? 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ' : 'Govt Schemes',
      query: language === 'hi' ? 'मेरे लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?' : language === 'pa' ? 'ਮੇਰੇ ਲਈ ਕਿਹੜੀਆਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਹਨ?' : 'Which government schemes can I apply for?',
    },
    {
      label: language === 'hi' ? 'मशीनरी किराया' : language === 'pa' ? 'ਮਸ਼ੀਨਰੀ ਕਿਰਾਇਆ' : 'Rent Machinery',
      query: language === 'hi' ? 'ट्रैक्टर या हार्वेस्टर कैसे किराए पर लें?' : language === 'pa' ? 'ਟਰੈਕਟਰ ਜਾਂ ਹਾਰਵੈਸਟਰ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?' : 'How do I rent a tractor or harvester?',
    },
    {
      label: language === 'hi' ? 'फसल बेचें' : language === 'pa' ? 'ਫ਼ਸਲ ਵੇਚੋ' : 'Sell Harvest',
      query: language === 'hi' ? 'मंडी में बिना कमीशन फसल कैसे बेचें?' : language === 'pa' ? 'ਮੰਡੀ ਵਿੱਚ ਬਿਨਾਂ ਕਮਿਸ਼ਨ ਫ਼ਸਲ ਕਿਵੇਂ ਵੇਚੀਏ?' : 'How can I sell my produce directly to buyers?',
    },
  ];

  const generateBotReply = (query: string): { text: string; actionTab?: string; actionLabel?: string } => {
    const q = query.toLowerCase();

    // 1. Disease Detection
    if (q.includes('disease') || q.includes('रोग') || q.includes('ਬਿਮਾਰ') || q.includes('ਰੋਗ') || q.includes('leaf') || q.includes('spot') || q.includes('tomato') || q.includes('wheat') || q.includes('rice') || q.includes('पत्ता') || q.includes('ਪੱਤਾ')) {
      if (language === 'hi') {
        return {
          text: 'अन्नदाता AI टमाटर, गेहूं और धान के पत्तों की फोटो से रोग पहचानता है। आप अपने फोन से पत्ते की साफ फोटो अपलोड करें, सिस्टम ICAR प्रमाणित जैविक व रासायनिक उपचार तुरंत बताएगा।',
          actionTab: 'disease',
          actionLabel: 'रोग पहचान खोलें',
        };
      }
      if (language === 'pa') {
        return {
          text: 'ਅੰਨਦਾਤਾ AI ਟਮਾਟਰ, ਕਣਕ ਅਤੇ ਝੋਨੇ ਦੇ ਪੱਤਿਆਂ ਦੀ ਫ਼ੋਟੋ ਤੋਂ ਰੋਗ ਪਛਾਣਦਾ ਹੈ। ਪੱਤੇ ਦੀ ਫ਼ੋਟੋ ਅੱਪਲੋਡ ਕਰੋ, ਸਿਸਟਮ ICAR ਪ੍ਰਮਾਣਿਤ ਜੈਵਿਕ ਅਤੇ ਰਸਾਇਣਕ ਇਲਾਜ ਤੁਰੰਤ ਦੱਸੇਗਾ।',
          actionTab: 'disease',
          actionLabel: 'ਰੋਗ ਪਛਾਣ ਖੋਲ੍ਹੋ',
        };
      }
      return {
        text: 'annData AI diagnoses leaf diseases for Tomato, Wheat, and Rice using deep learning vision models. Upload a clear leaf photo to receive certified organic remedies and approved chemical treatments.',
        actionTab: 'disease',
        actionLabel: 'Open Disease Detection',
      };
    }

    // 2. Irrigation / Water
    if (q.includes('irrigation') || q.includes('water') || q.includes('सिंचाई') || q.includes('पानी') || q.includes('ਸਿੰਚਾਈ') || q.includes('ਪਾਣੀ') || q.includes('tubewell') || q.includes('rain') || q.includes('बारिश') || q.includes('ਮੀਂਹ')) {
      if (language === 'hi') {
        return {
          text: 'वाटरविंडो आपके खेत की मिट्टी, फसल के विकास चरण और 7 दिनों के लाइव मौसम पूर्वानुमान को जोड़कर सटीक सलाह देता है। यदि बारिश की संभावना हो, तो यह अनावश्यक सिंचाई रोककर बिजली और पानी बचाता है।',
          actionTab: 'waterwindow',
          actionLabel: 'स्मार्ट सिंचाई देखें',
        };
      }
      if (language === 'pa') {
        return {
          text: 'ਵਾਟਰਵਿੰਡੋ ਤੁਹਾਡੇ ਖੇਤ ਦੀ ਮਿੱਟੀ, ਫ਼ਸਲ ਦੇ ਪੜਾਅ ਅਤੇ 7 ਦਿਨਾਂ ਦੇ ਲਾਈਵ ਮੌਸਮ ਅਨੁਮਾਨ ਨੂੰ ਜੋੜ ਕੇ ਸਹੀ ਸਿੰਚਾਈ ਸਲਾਹ ਦਿੰਦਾ ਹੈ। ਜੇਕਰ ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੋਵੇ ਤਾਂ ਇਹ ਪਾਣੀ ਅਤੇ ਬਿਜਲੀ ਦੀ ਬੱਚਤ ਕਰਾਉਂਦਾ ਹੈ।',
          actionTab: 'waterwindow',
          actionLabel: 'ਸਮਾਰਟ ਸਿੰਚਾਈ ਦੇਖੋ',
        };
      }
      return {
        text: 'WaterWindow calculates precise irrigation schedules based on real soil moisture, growth stage, and 7-day live rainfall forecasts. It automatically alerts you to hold tubewell operations if rain is incoming.',
        actionTab: 'waterwindow',
        actionLabel: 'Open Smart Irrigation',
      };
    }

    // 3. Schemes / Govt
    if (q.includes('scheme') || q.includes('योजना') || q.includes('ਸਕੀਮ') || q.includes('subsidy') || q.includes('सब्सिडी') || q.includes('pm-kisan') || q.includes('pmfby') || q.includes('smam') || q.includes('kcc') || q.includes('bima') || q.includes('ਬੀਮਾ')) {
      if (language === 'hi') {
        return {
          text: 'स्कीमसाथी पर 3 प्रमुख सरकारी योजनाएं उपलब्ध हैं: PM-KISAN (₹6000 सालाना वित्तीय सहायता), PMFBY (1.5% प्रीमियम पर रबी फसल सुरक्षा), और SMAM (कृषि यंत्रों पर 50% तक पूंजीगत सब्सिडी)।',
          actionTab: 'schemes',
          actionLabel: 'सरकारी योजनाएं देखें',
        };
      }
      if (language === 'pa') {
        return {
          text: 'ਸਕੀਮਸਾਥੀ \'ਤੇ 3 ਮੁੱਖ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਉਪਲਬਧ ਹਨ: PM-ਕਿਸਾਨ (ਸਾਲਾਨਾ ₹6000 ਸਿੱਧੀ ਸਹਾਇਤਾ), PMFBY (ਫ਼ਸਲ ਬੀਮਾ ਸੁਰੱਖਿਆ), ਅਤੇ SMAM (ਮਸ਼ੀਨਰੀ \'ਤੇ 50% ਤੱਕ ਦੀ ਸਬਸਿਡੀ)।',
          actionTab: 'schemes',
          actionLabel: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਦੇਖੋ',
        };
      }
      return {
        text: 'SchemeSaathi features 3 verified welfare initiatives: PM-KISAN (direct benefit transfer), PMFBY (comprehensive Rabi crop insurance at 1.5% premium), and SMAM (up to 50% capital subsidy on farm machinery).',
        actionTab: 'schemes',
        actionLabel: 'Explore Schemes',
      };
    }

    // 4. Machinery / Tractor
    if (q.includes('tractor') || q.includes('machinery') || q.includes('ट्रैक्टर') || q.includes('मशीनरी') || q.includes('ਟਰੈਕਟਰ') || q.includes('ਮਸ਼ੀਨਰੀ') || q.includes('rent') || q.includes('किराया') || q.includes('ਕਿਰਾਇਆ') || q.includes('harvester') || q.includes('drill')) {
      if (language === 'hi') {
        return {
          text: 'फेयरक्यू (FairQueue) के ज़रिए आप 45HP व 55HP ट्रैक्टर, लेज़र लैंड लेवलर और कंबाइन हार्वेस्टर पारदर्शी दरों पर बुक कर सकते हैं। टाइम-स्लॉट लॉक होने के कारण कोई विवाद या डबल-बुकिंग नहीं होती।',
          actionTab: 'fairqueue',
          actionLabel: 'मशीनरी किराया खोलें',
        };
      }
      if (language === 'pa') {
        return {
          text: 'ਫੇਅਰਕਿਊ (FairQueue) ਰਾਹੀਂ ਤੁਸੀਂ ਟਰੈਕਟਰ, ਹੈਪੀ ਸੀਡਰ ਅਤੇ ਕੰਬਾਈਨ ਹਾਰਵੈਸਟਰ ਨਿਰਧਾਰਿਤ ਰੇਟ \'ਤੇ ਬੁੱਕ ਕਰ ਸਕਦੇ ਹੋ। ਸਮਾਂ-ਸਲਾਟ ਤਾਲਾਬੰਦੀ ਕਾਰਨ ਕੋਈ ਡਬਲ-ਬੁਕਿੰਗ ਨਹੀਂ ਹੁੰਦੀ।',
          actionTab: 'fairqueue',
          actionLabel: 'ਮਸ਼ੀਨਰੀ ਕਿਰਾਇਆ ਖੋਲ੍ਹੋ',
        };
      }
      return {
        text: 'FairQueue allows conflict-free booking of 45HP/55HP tractors, laser levellers, and seed drills with fixed hourly and daily rates. Atomic slot locks ensure zero double-booking during peak harvesting.',
        actionTab: 'fairqueue',
        actionLabel: 'Open Machinery Rental',
      };
    }

    // 5. Market / CropClock / Sell
    if (q.includes('market') || q.includes('cropclock') || q.includes('sell') || q.includes('buy') || q.includes('बेच') || q.includes('खरीद') || q.includes('ਵੇਚ') || q.includes('ਖਰੀਦ') || q.includes('price') || q.includes('मंडी') || q.includes('ਮੰਡੀ') || q.includes('bid') || q.includes('बोली') || q.includes('ਬੋਲੀ')) {
      if (language === 'hi') {
        return {
          text: 'कॉप क्लॉक (CropClock) में किसान कटाई से पहले ही अपनी फसल की सूची डालते हैं और सत्यापित खरीदार प्रतिस्पर्धी बोलियां लगाते हैं। इसमें 0% कमीशन लगता है और किसान को वास्तविक शुद्ध लाभ मिलता है।',
          actionTab: 'marketplace',
          actionLabel: 'फसल बाज़ार खोलें',
        };
      }
      if (language === 'pa') {
        return {
          text: 'ਕ੍ਰੌਪ ਕਲਾਕ (CropClock) ਵਿੱਚ ਕਿਸਾਨ ਵਾਢੀ ਤੋਂ ਪਹਿਲਾਂ ਫ਼ਸਲ ਦੀ ਸੂਚੀ ਪਾਉਂਦੇ ਹਨ ਅਤੇ ਖਰੀਦਦਾਰ ਸਿੱਧੀ ਬੋਲੀ ਲਗਾਉਂਦੇ ਹਨ। ਇਸ ਵਿੱਚ 0% ਕਮਿਸ਼ਨ ਲੱਗਦਾ ਹੈ ਅਤੇ ਪੂਰਾ ਮੁਨਾਫ਼ਾ ਕਿਸਾਨ ਨੂੰ ਮਿਲਦਾ ਹੈ।',
          actionTab: 'marketplace',
          actionLabel: 'ਫ਼ਸਲ ਮੰਡੀ ਖੋਲ੍ਹੋ',
        };
      }
      return {
        text: 'CropClock enables farmers to list prospective harvests prior to cutting. Verified institutional buyers place transparent bids with zero middleman deductions and 100% digital escrow protection.',
        actionTab: 'marketplace',
        actionLabel: 'Open CropClock Marketplace',
      };
    }

    // Default Fallback
    if (language === 'hi') {
      return {
        text: 'मैं अन्नदाता मंच का किसी भी भाग में मार्गदर्शन कर सकता हूँ। आप फसल रोग निदान, मौसम अनुकूल सिंचाई, 3 सरकारी योजनाओं, ट्रैक्टर किराए, या सीधी मंडी बिक्री के बारे में कोई भी प्रश्न पूछ सकते हैं।',
        actionTab: 'home',
        actionLabel: 'मुख्य पृष्ठ पर जाएं',
      };
    }
    if (language === 'pa') {
      return {
        text: 'ਮੈਂ ਅੰਨਦਾਤਾ ਪਲੇਟਫਾਰਮ ਦੇ ਕਿਸੇ ਵੀ ਹਿੱਸੇ ਬਾਰੇ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਫ਼ਸਲ ਰੋਗ, ਸਮਾਰਟ ਸਿੰਚਾਈ, ਸਰਕਾਰੀ ਸਕੀਮਾਂ, ਮਸ਼ੀਨਰੀ ਕਿਰਾਏ ਜਾਂ ਮੰਡੀ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛ ਸਕਦੇ ਹੋ।',
        actionTab: 'home',
        actionLabel: 'ਮੁੱਖ ਪੰਨੇ \'ਤੇ ਜਾਓ',
      };
    }
    return {
      text: 'I can guide you through every feature of annData. Feel free to ask about AI leaf disease diagnosis, irrigation timing, government schemes, machinery booking, or direct crop trading.',
      actionTab: 'home',
      actionLabel: 'Go to Home',
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const replyData = generateBotReply(text);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyData.text,
        actionTab: replyData.actionTab,
        actionLabel: replyData.actionLabel,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Small Floating Chatbot Trigger Button (Bottom Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 24px -4px rgba(5, 150, 105, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'scale(0.95)' : 'scale(1)',
          }}
          title={
            language === 'hi'
              ? 'अन्नदाता कृषि सहायक से पूछें'
              : language === 'pa'
              ? 'ਅੰਨਦਾਤਾ ਖੇਤੀ ਸਹਾਇਕ ਨਾਲ ਗੱਲ ਕਰੋ'
              : 'Chat with annData Assistant'
          }
          aria-label="Open Agri Chatbot"
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>

      {/* Floating Chat Section / Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '370px',
            maxWidth: 'calc(100vw - 36px)',
            height: '490px',
            maxHeight: '75vh',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -8px rgba(15, 45, 36, 0.25), 0 0 0 1px rgba(0,0,0,0.06)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>
                  {language === 'hi'
                    ? 'अन्नदाता कृषि सहायक'
                    : language === 'pa'
                    ? 'ਅੰਨਦਾਤਾ ਖੇਤੀ ਸਹਾਇਕ'
                    : 'annData Assistant'}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#86efac',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                    {language === 'hi'
                      ? 'ऑनलाइन • सक्रिय'
                      : language === 'pa'
                      ? 'ਆਨਲਾਈਨ • ਤਿਆਰ'
                      : 'Online • 24/7 Advisory'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                width: 28,
                height: 28,
                borderRadius: '50%',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Close chatbot window"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '0.9rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: '#f8fafc',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '86%',
                    padding: '0.65rem 0.85rem',
                    borderRadius:
                      msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.sender === 'user' ? '#059669' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                    fontSize: '0.84rem',
                    lineHeight: 1.45,
                    border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: msg.sender === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <p style={{ margin: 0 }}>{msg.text}</p>

                  {msg.actionTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(msg.actionTab!);
                        setIsOpen(false);
                      }}
                      style={{
                        marginTop: '0.55rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '6px',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.76rem',
                        fontWeight: 650,
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <span>{msg.actionLabel || 'Open Section'}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    marginTop: '3px',
                    padding: '0 4px',
                  }}
                >
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.76rem', padding: '0.2rem' }}>
                <Bot size={14} />
                <span>
                  {language === 'hi'
                    ? 'अन्नदाता सहायक सोच रहा है...'
                    : language === 'pa'
                    ? 'ਅੰਨਦਾਤਾ ਸਹਾਇਕ ਲਿਖ ਰਿਹਾ ਹੈ...'
                    : 'annData Assistant is typing...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Strip */}
          <div
            style={{
              padding: '0.45rem 0.65rem',
              background: '#ffffff',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'hi'
                  ? 'अपना कृषि प्रश्न यहाँ लिखें...'
                  : language === 'pa'
                  ? 'ਆਪਣਾ ਖੇਤੀ ਸਵਾਲ ਇੱਥੇ ਲਿਖੋ...'
                  : 'Type your farming question...'
              }
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: inputText.trim() ? '#059669' : '#e2e8f0',
                color: inputText.trim() ? '#ffffff' : '#94a3b8',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
