/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getCategories, getEntityRecord } from '../resolvers';
import { setRequested, receiveTerms, receiveEntityRecords, addEntities } from '../actions';

jest.mock( '@wordpress/api-request' );

describe( 'getCategories', () => {
	const CATEGORIES = [ { id: 1 } ];

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/categories' ) {
				return Promise.resolve( CATEGORIES );
			}
		} );
	} );

	it( 'yields with requested terms', async () => {
		const fulfillment = getCategories();
		const requested = ( await fulfillment.next() ).value;
		expect( requested.type ).toBe( setRequested().type );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveTerms( 'categories', CATEGORIES ) );
	} );
} );

describe( 'getEntityRecord', () => {
	const POST_TYPE = { slug: 'post' };
	const POST_TYPES = {
		post: {
			rest_base: 'posts',
		},
	};
	const POST = { id: 10, title: 'test' };

	beforeAll( () => {
		apiRequest.mockImplementation( ( options ) => {
			if ( options.path === '/wp/v2/types/post?context=edit' ) {
				return Promise.resolve( POST_TYPE );
			}
			if ( options.path === '/wp/v2/posts/10?context=edit' ) {
				return Promise.resolve( POST );
			}
			if ( options.path === '/wp/v2/types?context=edit' ) {
				return Promise.resolve( POST_TYPES );
			}
		} );
	} );

	it( 'yields with requested post type', async () => {
		const state = {
			entities: {
				config: [
					{ name: 'postType', kind: 'root', baseUrl: '/wp/v2/types' },
				],
			},
		};
		const fulfillment = getEntityRecord( state, 'root', 'postType', 'post' );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEntityRecords( 'root', 'postType', POST_TYPE ) );
	} );

	it( 'loads the kind entities and yields with requested post type', async () => {
		const fulfillment = getEntityRecord( { entities: {} }, 'postType', 'post', 10 );
		const receivedEntities = ( await fulfillment.next() ).value;
		expect( receivedEntities ).toEqual( addEntities( [ {
			baseUrl: '/wp/v2/posts',
			kind: 'postType',
			name: 'post',
		} ] ) );
		const received = ( await fulfillment.next() ).value;
		expect( received ).toEqual( receiveEntityRecords( 'postType', 'post', POST ) );
	} );
} );
