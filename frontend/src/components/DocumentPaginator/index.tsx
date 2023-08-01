import { numberWithCommas } from '../../utils/numbers';

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
  return (
    <div className="my-4 flex justify-center">
      <ul className="pagination pagination-sm">
        {pageItems.map((item, i) =>
          typeof item === 'number' ? (
            <button
              key={item}
              className={`border px-3 py-2 text-sm ${
                currentPage === item
                  ? 'border-blue-500 text-blue-500'
                  : 'border-gray-300 text-gray-500'
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
              className={`border border-gray-300 px-3 py-2 text-sm text-gray-500`}
            >
              ...
            </button>
          )
        )}
      </ul>
    </div>
  );
}
