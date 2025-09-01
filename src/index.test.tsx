import React from 'react'
import { expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MuiOtpInput } from './index'
import * as testUtils from './testUtils'
import '@testing-library/jest-dom/vitest'

describe('components/MuiOtpInput', () => {
  test('should not crash', () => {
    render(<MuiOtpInput />)
  })

  test('should display 4 inputs by default', () => {
    render(<MuiOtpInput />)
    expect(screen.getAllByRole('textbox').length).toBe(4)
  })

  test('should display n inputs according to the length prop', () => {
    render(<MuiOtpInput length={5} />)
    expect(screen.getAllByRole('textbox').length).toBe(5)
  })

  test('should split value into different inputs', () => {
    render(<MuiOtpInput value="abcd" />)
    expect(testUtils.getInputElementByIndex(0).value).toBe('a')
    expect(testUtils.getInputElementByIndex(1).value).toBe('b')
    expect(testUtils.getInputElementByIndex(2).value).toBe('c')
    expect(testUtils.getInputElementByIndex(3).value).toBe('d')
  })

  test('should split value into different inputs or let empty value', () => {
    render(<MuiOtpInput value="ab" />)
    expect(testUtils.getInputElementByIndex(0).value).toBe('a')
    expect(testUtils.getInputElementByIndex(1).value).toBe('b')
    expect(testUtils.getInputElementByIndex(2).value).toBe('')
    expect(testUtils.getInputElementByIndex(3).value).toBe('')
  })

  test('should not focus first input by default', () => {
    render(<MuiOtpInput value="abcd" />)
    expect(testUtils.getInputElementByIndex(0)).not.toHaveFocus()
  })

  test('should focus first input according to the autoFocus prop', () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus
    render(<MuiOtpInput value="abcd" autoFocus />)
    expect(testUtils.getInputElementByIndex(0)).toHaveFocus()
  })

  describe('focus behavior', () => {
    test('should redirect focus to first empty input when clicking on subsequent empty input', async () => {
      const user = userEvent.setup()
      render(<MuiOtpInput value="12" length={6} />)

      // empty input
      const fourthInput = testUtils.getInputElementByIndex(4)
      // first empty input
      const thirdInput = testUtils.getInputElementByIndex(2)

      await user.click(fourthInput)

      await waitFor(() => {
        expect(thirdInput).toHaveFocus()
      })
    })

    test('should allow focusing on filled inputs for editing', async () => {
      const user = userEvent.setup()
      render(<MuiOtpInput value="1234" length={6} />)

      // filled input with "2"
      const secondInput = testUtils.getInputElementByIndex(1)

      await user.click(secondInput)

      expect(secondInput).toHaveFocus()
    })

    test('should allow focusing on the first empty input directly', async () => {
      const user = userEvent.setup()
      render(<MuiOtpInput value="12" length={6} />)

      // first empty input
      const thirdInput = testUtils.getInputElementByIndex(2)

      await user.click(thirdInput)

      expect(thirdInput).toHaveFocus()
    })

    test('should redirect focus correctly with different partial values', async () => {
      const user = userEvent.setup()
      render(<MuiOtpInput value="123" length={6} />)

      // empty input
      const sixthInput = testUtils.getInputElementByIndex(5)
      // first empty input
      const fourthInput = testUtils.getInputElementByIndex(3)

      await user.click(sixthInput)

      await waitFor(() => {
        expect(fourthInput).toHaveFocus()
      })
    })
  })
})
