import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Phone, Mail, Clock, User, Bot, Minimize2, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  agent?: {
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
  };
}

interface ChatSession {
  id: string;
  status: 'waiting' | 'active' | 'ended';
  agent?: {
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
  };
  startTime: Date;
  messages: Message[];
}

const ChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !session) {
      startNewSession();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      status: 'waiting',
      startTime: new Date(),
      messages: [
        {
          id: '1',
          text: 'Welcome to Everbright Optical Clinic! How can we help you today?',
          sender: 'system',
          timestamp: new Date(),
          type: 'system'
        }
      ]
    };
    setSession(newSession);
    
    // Simulate agent connection after a delay
    setTimeout(() => {
      connectToAgent();
    }, 2000);
  };

  const connectToAgent = () => {
    if (!session) return;

    const agent = {
      name: 'Dr. Sarah Johnson',
      avatar: '/avatars/agent-sarah.jpg',
      status: 'online' as const
    };

    setSession(prev => prev ? {
      ...prev,
      status: 'active',
      agent,
      messages: [
        ...prev.messages,
        {
          id: Date.now().toString(),
          text: `Hi! I'm ${agent.name}, your optometrist. I'm here to help you with any questions about your eye care needs.`,
          sender: 'agent',
          timestamp: new Date(),
          type: 'text',
          agent
        }
      ]
    } : null);
  };

  const sendMessage = async () => {
    if (!message.trim() || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

    setMessage('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      setAgentTyping(true);
      setTimeout(() => {
        const responses = [
          "I understand your concern. Let me help you with that.",
          "That's a great question! Based on your situation, I'd recommend...",
          "I can definitely help you with that. Here's what I suggest...",
          "Thank you for sharing that information. Let me provide you with some guidance...",
          "I see what you mean. Let me explain the best approach for your case..."
        ];
        
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: responses[Math.floor(Math.random() * responses.length)],
          sender: 'agent',
          timestamp: new Date(),
          type: 'text',
          agent: session?.agent
        };

        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, agentResponse]
        } : null);

        setAgentTyping(false);
        setIsTyping(false);
      }, 2000);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <Card className="h-full shadow-2xl border-0">
        <CardHeader className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session?.agent?.avatar} />
                  <AvatarFallback>
                    {session?.agent?.name ? session.agent.name[0] : 'A'}
                  </AvatarFallback>
                </Avatar>
                {session?.agent && (
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(session.agent.status)}`}></div>
                )}
              </div>
              <div>
                <CardTitle className="text-white text-sm">
                  {session?.agent ? session.agent.name : 'Everbright Optical'}
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs">
                  {session?.agent ? getStatusText(session.agent.status) : 'Connecting...'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-700"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {session?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${
                      msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {msg.sender !== 'user' && (
                        <Avatar className="w-6 h-6 mt-1">
                          <AvatarImage src={msg.agent?.avatar} />
                          <AvatarFallback>
                            {msg.sender === 'agent' ? (msg.agent?.name[0] || 'A') : 'S'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg px-3 py-2 ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : msg.sender === 'system'
                          ? 'bg-gray-100 text-gray-700 text-center'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <Avatar className="w-6 h-6 mt-1">
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-200 rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={session?.status !== 'active'}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || session?.status !== 'active'}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {session?.status === 'waiting' && (
                <div className="mt-2 text-center">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Waiting for agent...
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ChatSupport;
