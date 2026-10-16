import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

/**
 * Base class for the `{ items, nextCursor }` envelope every list endpoint
 * returns. Extend it with the item schema:
 * `class FooPageDto extends PageOf({ type: [FooDto] }) {}`
 */
export function PageOf(itemsSchema: ApiPropertyOptions) {
  class Page {
    @ApiProperty({
      ...itemsSchema,
      description: "One page of results in the endpoint's fixed sort order.",
    })
    items!: unknown[];

    @ApiProperty({
      type: String,
      nullable: true,
      example: 'eyJ0IjoiZmlsZSIsIm4iOiJyZXBvcnQucGRmIiwiaSI6IjNmYTg1ZjY0In0',
      description:
        'Opaque cursor for the next page: pass it back unchanged as `cursor`. `null` means this was the last page.',
    })
    nextCursor!: string | null;
  }
  return Page;
}
