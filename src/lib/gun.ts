import Gun from 'gun';

export const GUN_PEERS = [
  import.meta.env.VITE_GUN_PEER || 'https://try.axe.eco/gun'
];

export const gun = Gun({
  peers: GUN_PEERS,
  localStorage: true
});

export const root = gun.get('fazilet-reels-v1');
