import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { Text, Icon, colors, spacing, borderRadius } from '../../';

interface AudioPlayerProps {
  url: string;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, title }) => {
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
    setIsLoading(false);
  }, []);

  const onProgress = useCallback((data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  }, []);

  const onEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    videoRef.current?.seek(0);
  }, []);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const onSliderValueChange = (value: number) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        paused={!isPlaying}
        onLoad={onLoad}
        onProgress={onProgress}
        onEnd={onEnd}
        onError={() => setIsLoading(false)}
        audioOnly
        playInBackground={false}
        style={styles.hiddenVideo}
      />

      <TouchableOpacity style={styles.playButton} onPress={togglePlay} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Icon name={isPlaying ? 'close' : 'playCircle'} size={20} color={colors.primary} />
        )}
      </TouchableOpacity>

      <View style={styles.controls}>
        {title && (
          <Text variant="caption" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        )}
        <View style={styles.sliderRow}>
          <Text variant="caption" color="muted" style={styles.time}>
            {formatTime(currentTime)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingComplete={onSliderValueChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text variant="caption" color="muted" style={styles.time}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  hiddenVideo: {
    width: 0,
    height: 0,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 30,
  },
  time: {
    width: 36,
    textAlign: 'center',
    fontSize: 10,
  },
});
