'use client';

type Props = {
  videoUrl: string;
};
export const VideoPlayer = ({ videoUrl }: Props) => {
  return (
    <video
      src={videoUrl}
      style={{ display: 'block' }}
      width="100%"
      height="100%"
      autoPlay
      muted
      playsInline
      controls={false}
    />
  );
};
