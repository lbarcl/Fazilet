type PhotoModule = {
  default: string;
};

const modules = import.meta.glob<PhotoModule>(
  './photos/*.{avif,AVIF,gif,GIF,jpeg,JPEG,jpg,JPG,png,PNG,webp,WEBP}',
  {
    eager: true,
    query: '?url'
  }
);

export type ReelPhoto = {
  id: string;
  src: string;
  name: string;
  fileName: string;
};

export const photos: ReelPhoto[] = Object.entries(modules)
  .map(([path, module]) => {
    const file = path.split('/').pop() ?? path;
    const name = file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

    return {
      id: file.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      fileName: file,
      name,
      src: module.default
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
