import { Injectable } from "@angular/core";
import { MatPaginatorIntl } from "@angular/material/paginator";

@Injectable()

export class TranslationPaginator extends MatPaginatorIntl {
  constructor() {
    super();
  }

  override itemsPerPageLabel: string = 'Elementos por página';
  override nextPageLabel: string = 'Página siguiente';
  override previousPageLabel: string = 'Página anterior';
  override firstPageLabel: string = 'Primera página';
  override lastPageLabel: string = 'Última página';

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length
      ? Math.min(startIndex + pageSize, length)
      : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };
}
