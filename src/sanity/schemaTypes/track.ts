import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'track',
  title: 'Track (Canción)',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Orden (1, 2, 3...)',
      type: 'number',
      initialValue: 1,
    }),
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'artist',
      title: 'Artista',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    // --- NUEVO CAMPO LUFS ---
    defineField({
      name: 'lufs',
      title: 'LUFS (ej: -9.5 LUFS)',
      type: 'string',
      initialValue: '-14.0 LUFS',
    }),
    defineField({
      name: 'tags',
      title: 'Etiquetas',
      type: 'array',
      of: [{type: 'string'}],
      options: { layout: 'tags' }
    }),
    defineField({
      name: 'mix',
      title: 'Archivo MIX',
      type: 'file',
      options: { accept: 'audio/*' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'master',
      title: 'Archivo MASTER',
      type: 'file',
      options: { accept: 'audio/*' },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'artist',
    }
  }
})