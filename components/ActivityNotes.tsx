'use client';

import { useState, useEffect } from 'react';
import { FormField, Input, Textarea, Button } from '@/components/ui';

interface ActivityNotesProps {
  activityId: string;
  initialNotes?: string;
  initialTags?: string[];
  onSave?: (notes: string, tags: string[]) => void;
}

export default function ActivityNotes({ activityId, initialNotes = '', initialTags = [], onSave }: ActivityNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
    setTags(initialTags);
  }, [initialNotes, initialTags]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/activities/${activityId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, tags }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        onSave?.(notes, tags);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const commonTags = ['race', 'training', 'recovery', 'long-run', 'interval', 'easy', 'tempo', 'hill', 'trail', 'road'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Notes & Tags</h2>
      
      <FormField label="Notes" className="mb-6">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add your notes about this activity..."
          className="min-h-[100px]"
        />
      </FormField>

      <FormField label="Tags" className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-strava/15 text-strava dark:bg-strava/25 dark:text-strava-muted"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 hover:text-red-600 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <Input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag..."
            className="flex-1"
          />
          <Button variant="secondary" onClick={addTag} size="md">
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Quick add:</span>
          {commonTags
            .filter(tag => !tags.includes(tag))
            .map((tag) => (
              <button
                key={tag}
                onClick={() => !tags.includes(tag) && setTags([...tags, tag])}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                + {tag}
              </button>
            ))}
        </div>
      </FormField>

      <div className="flex items-center justify-between pt-2">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Saving...' : 'Save Notes & Tags'}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Saved!</span>
        )}
      </div>
    </div>
  );
}

