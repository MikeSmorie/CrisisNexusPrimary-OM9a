import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Send, 
  Save,
  WifiOff,
  Upload,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessage {
  id: string;
  audioBlob: Blob;
  transcript: string;
  timestamp: Date;
  duration: number;
  isOffline: boolean;
}

interface VoiceRecorderProps {
  isOnline: boolean;
  onSendMessage: (message: string, voiceData?: ArrayBuffer) => Promise<boolean>;
  className?: string;
}

export function VoiceRecorder({ isOnline, onSendMessage, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMessages, setRecordedMessages] = useState<VoiceMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load offline messages from localStorage
    const stored = localStorage.getItem('voiceMessages');
    if (stored) {
      try {
        const messages = JSON.parse(stored);
        setRecordedMessages(messages);
      } catch (error) {
        console.error('Failed to load stored messages:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save messages to localStorage
    localStorage.setItem('voiceMessages', JSON.stringify(recordedMessages));
  }, [recordedMessages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const message: VoiceMessage = {
          id: crypto.randomUUID(),
          audioBlob,
          transcript: transcript || "[Voice message - transcription pending]",
          timestamp: new Date(),
          duration: recordingTime,
          isOffline: !isOnline
        };

        setRecordedMessages(prev => [...prev, message]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: isOnline ? "Voice message recording" : "Offline recording - will send when connection restored",
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }

      toast({
        title: "Recording Stopped",
        description: `${recordingTime}s voice message saved`,
      });
    }
  };

  const playMessage = (message: VoiceMessage) => {
    if (isPlaying === message.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(null);
      return;
    }

    // Start playing
    const audioUrl = URL.createObjectURL(message.audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(null);
      URL.revokeObjectURL(audioUrl);
    };

    audio.play();
    setIsPlaying(message.id);
  };

  const sendMessage = async (message: VoiceMessage) => {
    try {
      const arrayBuffer = await message.audioBlob.arrayBuffer();
      const success = await onSendMessage(message.transcript, arrayBuffer);
      
      if (success) {
        setRecordedMessages(prev => prev.filter(m => m.id !== message.id));
        toast({
          title: "Message Sent",
          description: "Voice message delivered successfully"
        });
      } else {
        toast({
          title: "Send Failed",
          description: "Message queued for retry",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Send Failed",
        description: "Could not send voice message",
        variant: "destructive"
      });
    }
  };

  const sendAllOfflineMessages = async () => {
    const offlineMessages = recordedMessages.filter(m => m.isOffline);
    
    for (const message of offlineMessages) {
      await sendMessage(message);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const offlineCount = recordedMessages.filter(m => m.isOffline).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Voice Communication</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
            {offlineCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendAllOfflineMessages}
                disabled={!isOnline}
              >
                <Upload className="h-3 w-3 mr-1" />
                Send {offlineCount}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Voice Recording</h4>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                REC {formatDuration(recordingTime)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex-1"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          </div>

          {isRecording && (
            <div className="mt-3">
              <Progress value={(recordingTime % 60) / 60 * 100} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">
                {isOnline ? "Recording for immediate delivery" : "Recording for offline storage"}
              </p>
            </div>
          )}
        </div>

        {/* Message Queue */}
        {recordedMessages.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Recorded Messages</h4>
            {recordedMessages.map((message) => (
              <div 
                key={message.id} 
                className={`p-3 border rounded-lg ${message.isOffline ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playMessage(message)}
                    >
                      {isPlaying === message.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <div>
                      <p className="text-sm font-medium">
                        {formatDuration(message.duration)} • {message.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {message.transcript}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {message.isOffline && (
                      <WifiOff className="h-4 w-4 text-yellow-600" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(message)}
                      disabled={!isOnline && !message.isOffline}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline Status */}
        {!isOnline && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Offline Mode Active
                </p>
                <p className="text-xs text-red-700">
                  Voice messages will be stored locally and sent when connection is restored
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}