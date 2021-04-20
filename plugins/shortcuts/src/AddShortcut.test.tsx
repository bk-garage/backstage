/*
 * Copyright 2021 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddShortcut } from './AddShortcut';
import { LocalStoredShortcuts } from './api';
import { MockStorageApi, wrapInTestApp } from '@backstage/test-utils';
import { AlertDisplay } from '@backstage/core';

describe('AddShortcut', () => {
  const api = new LocalStoredShortcuts(MockStorageApi.create());

  const props = {
    onClose: jest.fn(),
    anchorEl: document.createElement('div'),
    api,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.title = 'some document title';
  });

  it('displays the title', async () => {
    render(wrapInTestApp(<AddShortcut {...props} />));

    await waitFor(() => {
      expect(screen.getByText('Add Shortcut')).toBeInTheDocument();
    });
  });

  it('closes the popup', async () => {
    render(wrapInTestApp(<AddShortcut {...props} />));

    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('saves the input', async () => {
    const spy = jest.spyOn(api, 'add');

    render(wrapInTestApp(<AddShortcut {...props} />));

    const urlInput = screen.getByPlaceholderText('Enter a URL');
    const titleInput = screen.getByPlaceholderText('Enter a display name');
    fireEvent.change(urlInput, { target: { value: '/some-url' } });
    fireEvent.change(titleInput, { target: { value: 'some title' } });

    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(spy).toBeCalledWith({
        title: 'some title',
        url: '/some-url',
      });
    });
  });

  it('pastes the values', async () => {
    const spy = jest.spyOn(api, 'add');

    render(
      wrapInTestApp(<AddShortcut {...props} />, {
        routeEntries: ['/some-initial-url'],
      }),
    );

    fireEvent.click(screen.getByText('Paste Current Url'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(spy).toBeCalledWith({
        title: 'some document title',
        url: '/some-initial-url',
      });
    });
  });

  it('displays errors', async () => {
    jest.spyOn(api, 'add').mockRejectedValueOnce(new Error('some add error'));

    render(
      wrapInTestApp(
        <>
          <AlertDisplay />
          <AddShortcut {...props} />
        </>,
      ),
    );

    fireEvent.click(screen.getByText('Paste Current Url'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(
        screen.getByText('Could not add shortcut: some add error'),
      ).toBeInTheDocument();
    });
  });
});
