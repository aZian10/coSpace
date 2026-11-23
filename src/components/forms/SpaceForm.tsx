'use client';

import React, { useState } from 'react';
import { SpaceType } from '@prisma/client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Building, X, Save, AlertCircle, Upload, Loader2 } from 'lucide-react';

interface SpaceFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    type: SpaceType;
    capacity: number;
    pricePerHour: number;
    imageUrl: string;
    location?: string | null;
    amenities: string[];
    isActive?: boolean;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const SpaceForm: React.FC<SpaceFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useI18n();
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState<string>(initialData?.name || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [type, setType] = useState<SpaceType>(initialData?.type || SpaceType.DESK);
  const [capacity, setCapacity] = useState<number>(initialData?.capacity || 1);
  const [pricePerHour, setPricePerHour] = useState<number>(initialData?.pricePerHour || 15);
  const [imageUrl, setImageUrl] = useState<string>(
    initialData?.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
  );
  const [location, setLocation] = useState<string>(initialData?.location || '');
  const [amenitiesString, setAmenitiesString] = useState<string>(
    initialData?.amenities.join(', ') || 'WiFi 6, Enchufes, Café ilimitado'
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'spaces');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al subir la imagen a S3');
        setUploading(false);
        return;
      }

      setImageUrl(data.url);
    } catch {
      setError('Error de conexión al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amenities = amenitiesString
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      name,
      description,
      type,
      capacity: Number(capacity),
      pricePerHour: Number(pricePerHour),
      imageUrl,
      location: location || undefined,
      amenities,
    };

    try {
      const url = isEditing ? `/api/spaces/${initialData?.id}` : '/api/spaces';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar el espacio');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError('Error al conectar con el servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="liquid-glass w-full max-w-xl p-6 sm:p-8 rounded-2xl border border-white/20 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            {isEditing ? t('admin.editSpace') : t('admin.createSpace')}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('form.spaceName')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl"
              placeholder="Ej: Escritorio Flexible Zona Zen"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('form.spaceType')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SpaceType)}
                className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl bg-slate-900 text-white"
              >
                <option value={SpaceType.DESK}>Escritorio (DESK)</option>
                <option value={SpaceType.MEETING_ROOM}>Sala de Juntas (MEETING_ROOM)</option>
                <option value={SpaceType.CABIN}>Cabina Acústica (CABIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('form.spaceCapacity')}
              </label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('form.spacePrice')}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={pricePerHour}
                onChange={(e) => setPricePerHour(Number(e.target.value))}
                className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('form.spaceLocation')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Piso 2 - Módulo A"
                className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('form.spaceImage')}
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium cursor-pointer transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Subiendo imagen a S3...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Subir imagen desde el equipo (JPG, PNG, WEBP, AVIF - máx 5 MB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Vista previa del espacio"
                  className="w-full h-28 object-cover rounded-xl border border-white/10"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('form.spaceDesc')}
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full liquid-glass-input px-3.5 py-2 rounded-xl text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('form.spaceAmenities')}
            </label>
            <input
              type="text"
              required
              value={amenitiesString}
              onChange={(e) => setAmenitiesString(e.target.value)}
              className="w-full liquid-glass-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="liquid-glass-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : t('form.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceForm;
