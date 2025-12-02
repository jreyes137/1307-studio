import { type SchemaTypeDefinition } from 'sanity'
import track from './track'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [track],
}