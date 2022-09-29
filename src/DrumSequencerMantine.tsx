import { ActionIcon, Box, Button, SimpleGrid, Stack } from "@mantine/core";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { Tuple } from "./Tuple";
import { FaPlay, FaStop } from "react-icons/fa";
import { Time } from "tone/build/esm/core/type/Units";

type DrumPlayFunction = (time?: Time) => void;

interface DrumSound {
  name: string;
  play: DrumPlayFunction;
}

const kickSynth = new Tone.MembraneSynth().toDestination();
const snareSynth = new Tone.NoiseSynth({
  noise: { type: "white" },
}).toDestination();
const cymbalSynth = new Tone.MetalSynth().toDestination();

const playKick = (time?: Time) => {
  kickSynth.triggerAttackRelease("C0", 0.3, time);
};

const playSnare = (time?: Time) => {
  snareSynth.triggerAttackRelease(0.05, time);
};

const playHiHatClosed = (time?: Time) => {
  cymbalSynth.triggerAttackRelease("C6", 0.01, time);
};

const playHiHatOpen = (time?: Time) => {
  cymbalSynth.triggerAttackRelease("C6", 0.5, time);
};

const instruments: DrumSound[] = [
  { name: "kick", play: playKick },
  { name: "snare", play: playSnare },
  { name: "hi hat (open)", play: playHiHatOpen },
  { name: "hi hat (closed)", play: playHiHatClosed },
];

const numberOfBeats = 8;

interface DrumTrack {
  sound: DrumSound;
  beatsToPlay: number[];
}

const toggleBeat = (beats: number[], beatIndex: number): number[] => {
  if (beats.includes(beatIndex)) {
    return _.without(beats, beatIndex);
  } else {
    return beats.concat(beatIndex);
  }
};

const getPartForTracks = (tracks: DrumTrack[]): Tone.Part => {
  const notes = tracks.flatMap((track) => {
    return track.beatsToPlay.flatMap((beatIndex) => {
      const timeNotation = "0:" + beatIndex;
      return { time: timeNotation, playFunction: track.sound.play };
    });
  });
  console.log(notes);
  return new Tone.Part((time, value) => {
    value.playFunction(time);
  }, notes);
};

export const DrumSequencerMantine = () => {
  const [drumTracks, setDrumTracks] = useState<DrumTrack[]>(
    instruments.map((instrument) => {
      return {
        sound: instrument,
        beatsToPlay: [],
      };
    })
  );

  //   const loop = useRef<Tone.Loop | null>(null);

  const part = useRef<Tone.Part | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    part.current?.stop();
    const newPart = getPartForTracks(drumTracks);
    part.current = newPart;
    newPart.start();
  }, [drumTracks]);

  return (
    <Stack>
      <DrumPads
        tracks={drumTracks}
        onBeatToggled={(track, beatIndex) => {
          const newBeats = toggleBeat(track.beatsToPlay, beatIndex);
          const newTracks = drumTracks.map((stateTrack) => {
            if (stateTrack === track) {
              return {
                ...track,
                beatsToPlay: newBeats,
              };
            } else {
              return stateTrack;
            }
          });
          //   track.sound.play();
          setDrumTracks(newTracks);
        }}
      />
      <ActionIcon
        variant="filled"
        onClick={() => {
          if (isPlaying) {
            Tone.Transport.stop();
            setIsPlaying(false);
          } else {
            Tone.start();
            Tone.Transport.loop = true;
            Tone.Transport.loopStart = "0:0";
            Tone.Transport.loopEnd = "0:8";
            Tone.Transport.timeSignature = 8;
            Tone.Transport.start();
            setIsPlaying(true);
          }
        }}
      >
        {isPlaying ? <FaStop /> : <FaPlay />}
      </ActionIcon>
    </Stack>
  );
};

interface DrumPadsProps {
  tracks: DrumTrack[];
  onBeatToggled: (track: DrumTrack, beatIndex: number) => void;
}

const DrumPads = (props: DrumPadsProps) => {
  return (
    <SimpleGrid
      cols={numberOfBeats}
      p={"sm"}
      sx={{
        width: "100%",
        height: "100%",
      }}
    >
      {props.tracks.flatMap((track) => {
        return _.range(numberOfBeats).flatMap((beatIndex) => {
          const isBeatEnabled = track.beatsToPlay.includes(beatIndex);
          return (
            <Box
              key={track.sound.name + beatIndex}
              sx={{
                width: "100%",
                height: 100,
                background: isBeatEnabled ? "green" : "red",
              }}
              onClick={() => {
                props.onBeatToggled(track, beatIndex);
              }}
            />
          );
        });
      })}
    </SimpleGrid>
  );
};
