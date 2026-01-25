import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image, Video, Loader2 } from 'lucide-react';

interface MediaUploadProps {
  bucket: 'product-media' | 'job-media';
  onUpload: (url: string, type: 'image' | 'video') => void;
  existingMedia?: { url: string; type: 'image' | 'video' }[];
  onRemove?: (url: string) => void;
  maxFiles?: number;
}

export const MediaUpload = ({ 
  bucket, 
  onUpload, 
  existingMedia = [], 
  onRemove,
  maxFiles = 5 
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (existingMedia.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files.`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload only images or videos.',
          variant: 'destructive',
        });
        continue;
      }

      // Limit video size to 50MB, images to 5MB
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${isVideo ? 'Videos' : 'Images'} must be under ${isVideo ? '50MB' : '5MB'}.`,
          variant: 'destructive',
        });
        continue;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onUpload(urlData.publicUrl, isVideo ? 'video' : 'image');
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || existingMedia.length >= maxFiles}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload Media
        </Button>
        <span className="text-xs text-muted-foreground">
          {existingMedia.length}/{maxFiles} files
        </span>
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {existingMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingMedia.map((media, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-secondary border border-border">
              {media.type === 'video' ? (
                <div className="flex items-center justify-center h-full">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              ) : (
                <img 
                  src={media.url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(media.url)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="absolute bottom-1 left-1">
                {media.type === 'video' ? (
                  <Video className="w-4 h-4 text-primary-foreground drop-shadow" />
                ) : (
                  <Image className="w-4 h-4 text-primary-foreground drop-shadow" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
