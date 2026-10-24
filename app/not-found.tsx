import React from 'react';
import { NotFoundClient } from './NotFoundClient';

export default function NotFound() {
  return (
    <>
      <title>404 – Page not found | Pixenox</title>
      <meta name="robots" content="noindex, follow" />
      <meta
        name="description"
        content="404 error: the page you were looking for could not be found on Pixenox."
      />
      <NotFoundClient />
    </>
  );
}
