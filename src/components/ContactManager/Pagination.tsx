import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  contactsPerPage: number;
  totalContacts: number;
  paginate: (pageNumber: number) => void;
  currentPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  contactsPerPage,
  totalContacts,
  paginate,
  currentPage,
}) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalContacts / contactsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className='flex justify-center space-x-2'>
        {pageNumbers.map(number => (
          <li key={number}>
            <Button
              onClick={() => paginate(number)}
              variant={currentPage === number ? 'default' : 'outline'}
              className='px-3 py-1'
            >
              {number}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
};