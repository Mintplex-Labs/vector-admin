import { CaretDown } from '@phosphor-icons/react';
import { numberWithCommas } from '@/utils/numbers';

function generatePageItems(total: number, current: number) {
  if (total <= 1) return [];
  const center = [current - 2, current - 1, current, current + 1, current + 2],
    filteredCenter = center.filter((p) => p > 1 && p < total),
    includeThreeLeft = current === 5,
    includeThreeRight = current === total - 4,
    includeLeftDots = current > 5,
    includeRightDots = current < total - 4;

  if (includeThreeLeft) filteredCenter.unshift(2);
  if (includeThreeRight) filteredCenter.push(total - 1);

  if (includeLeftDots) filteredCenter.unshift('...');
  if (includeRightDots) filteredCenter.push('...');

  return [1, ...filteredCenter, total];
}

interface IPaginationProps {
  pageCount: number;
  currentPage?: number;
  gotoPage: (page: number) => void;
}

export default function DocumentListPagination({
  pageCount,
  currentPage = 0,
  gotoPage,
}: IPaginationProps) {
  const pageItems = generatePageItems(pageCount, currentPage);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < pageCount;

  const goToPrevious = () => {
    if (currentPage > 1) gotoPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < pageCount) gotoPage(currentPage + 1);
  };

  if (pageCount < 2) return <div className="mb-18"></div>;

  return (
    <div className="my-4 -mt-8 mb-8 flex justify-center">
      {hasPrevious && (
        <button
          onClick={goToPrevious}
          className="rotate-90 px-2 text-white/20 transition-all duration-300 hover:text-sky-400"
        >
          <CaretDown size={20} weight="bold" />
        </button>
      )}
      <ul className="pagination pagination-sm">
        {pageItems.map((item, i) =>
          typeof item === 'number' ? (
            <button
              key={item}
              className={`border px-3 py-2 text-sm transition-all duration-300 hover:border-sky-400 hover:bg-sky-400/20 ${
                currentPage === item
                  ? 'border-sky-400 bg-sky-400 bg-opacity-20 text-white'
                  : 'border-white border-opacity-20 text-white text-opacity-60'
              } ${i === 0 ? 'rounded-l-lg' : ''} ${
                i === pageItems.length - 1 ? 'rounded-r-lg' : ''
              }`}
              onClick={() => gotoPage(item)}
            >
              {numberWithCommas(item)}
            </button>
          ) : (
            <button
              key={item}
              className={`border border-white border-opacity-20 px-3 py-2 text-sm text-gray-500`}
            >
              ...
            </button>
          )
        )}
      </ul>
      {hasNext && (
        <button
          onClick={goToNext}
          className="-rotate-90 px-2 text-white/20 transition-all duration-300 hover:text-sky-400"
        >
          <CaretDown size={20} weight="bold" />
        </button>
      )}
    </div>
  );
}
