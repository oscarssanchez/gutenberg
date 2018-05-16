/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage } from '../support/utils';

describe( 'autocompletion', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await newPost();
	} );

	it( 'adds a token followed by a non-breaking space and places the cursor afterward', async () => {
		await page.click( '.editor-default-block-appender' );

		const contentEditableHandle = (
			await page.evaluateHandle( () => document.activeElement )
		);

		await contentEditableHandle.asElement().type( '@' );
		const optionNode = await page.waitForSelector( '.components-autocomplete__result', { timeout: 10000 } );
		optionNode.click();

		await page.waitForFunction(
			( contentEditableNode ) => contentEditableNode.textContent.length > 0,
			{ timeout: 1000 },
			contentEditableHandle
		);

		const selectionAnchorHandle = await page.evaluateHandle( () => window.getSelection().anchorNode );
		expect( await page.evaluate(
			( contentEditableNode, anchorNode ) => contentEditableNode.contains( anchorNode ),
			contentEditableHandle,
			selectionAnchorHandle
		) ).toBeTruthy();
		expect( await page.evaluate(
			( anchorNode ) => anchorNode.nodeType === window.Node.TEXT_NODE,
			selectionAnchorHandle
		) ).toBeTruthy();
		const nonBreakingSpace = '\u00A0';
		expect( await page.evaluate(
			( anchorNode ) => anchorNode.nodeValue,
			selectionAnchorHandle
		) ).toBe( nonBreakingSpace );
		expect( await page.evaluate(
			() => window.getSelection().anchorOffset
		) ).toBe( nonBreakingSpace.length );

		const tokenHandle = await page.evaluateHandle(
			( anchorNode ) => anchorNode.previousSibling,
			selectionAnchorHandle
		);
		expect( await page.evaluate(
			( tokenNode ) => tokenNode.nodeType === window.Node.ELEMENT_NODE,
			tokenHandle
		) ).toBeTruthy();
		expect( await page.evaluate(
			( tokenNode ) => tokenNode.classList.contains( 'autocomplete-token' ),
			tokenHandle
		) ).toBeTruthy();
		expect( await page.evaluate(
			( tokenNode ) => /^@\w+$/.test( tokenNode.textContent ),
			tokenHandle
		) ).toBeTruthy();
	} );
} );
