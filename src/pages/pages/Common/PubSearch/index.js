import React, {Component} from 'react';
import _ from 'lodash';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {executeQuery} from '../../../../library/utils/fetch';
import PubItem from '../../../components/PubItem';
import SearchInputer from '../../../components/SearchInputer';
import BeerFilterSort from '../../../components/BeerFilterSort';
import Loading from '../../../components/Loading';
import {findFromArray} from '../../../../library/utils/array';
import Pagination from 'react-js-pagination';

import {
    pushNotification,
    NOTIFICATION_TYPE_WARNING,
    NOTIFICATION_TYPE_SUCCESS,
    NOTIFICATION_TYPE_ERROR
} from '../../../../library/utils/notification';

const getQuery = (aQueryString) => {
    if (!aQueryString) return null;
    const querySplitted = aQueryString.split('=');
    let key = querySplitted[0];
    const value = querySplitted[1];
    key = key.substr(1, key.length);
    let result = {};
    _.set(result, key, value);
    return result;
};

class PubSearch extends Component {

    constructor(props) {
        super(props);
        const query = getQuery(_.get(props, 'location.search'));
        this.state = {
            sPubData: [],
            sSearchWord: props.searchWord,
            sBeerData: [],
            sQuery: query ? {...query} : null,
            sPubFiltedArray: [],
            sFetchStatus: false,
            sIsMobileDimension: props.isMobileDimension,
            totalCount: 0,
            pageLimit: 10,
            activePage: 1,
            sVisibleData: []
        };
        this.filterArray = [
            {
                fieldName: 'count',
                title: '와인개수',
                values: [
                    {value: 9, title: '10개 미만', option: 'ste'},
                    {value: 10, title: '10개 이상', option: 'lte'},
                    {value: 20, title: '20개 이상', option: 'lte'},
                    {value: 30, title: '30개 이상', option: 'lte'},
                    {value: 40, title: '40개 이상', option: 'lte'},
                    {value: 50, title: '50개 이상', option: 'lte'},
                ]
            }
        ];
        this.sortArray = [
            {
                title: '이름',
                fieldName: 'name',
            },
            {
                title: '지역',
                fieldName: 'address',
            }
        ]
    }

    componentDidMount = () => {
        const {sQuery} = this.state;
        if (sQuery) {
            this.getBeerData(sQuery.beerId);
        }
        this.getPubData();
    };

    componentWillReceiveProps = (newProps) => {
        this.setState({
            sIsMobileDimension: newProps.isMobileDimension,
            sSearchWord: newProps.searchWord
        });

        this.setVisibleData(this.state.sPubFiltedArray, newProps.searchWord);
    };

    getBeerData = (aId) => {
        executeQuery({
            method: 'get',
            url: `/beer/fetchone?id=${aId}`,
            success: (res) => {
                const result = _.get(res, 'beer[0]') || null;
                if (result) {
                    this.setState({
                        sSearchWord: result.name || '',
                    })
                }
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    getPubData = () => {
        executeQuery({
            method: 'get',
            url: '/pub/fetchall',
            success: (res) => {
                let result = _.get(res, 'pub') || '';
                _.map(result, (pubItem, pubIndex) => {
                    const beerArray = _.get(pubItem, 'mainMenu') || [];
                    let beer = [];
                    _.map(beerArray, (beerItem, beerIndex) => {
                        const beerData = _.get(beerItem, 'beer') || '';
                        const isSame = findFromArray(beer, '_id', beerData.id);
                        if (!isSame) {
                            beer.push(beerData)
                        }
                    });
                    pubItem.count = beer.length;
                });
                this.setState({
                    sFetchStatus: true,
                    sPubData: result,
                    sPubFiltedArray: result,
                });

                this.setVisibleData(result, this.state.sSearchWord);
            },
            fail: (err, res) => {
                const errMsg = _.get(err, 'data.error');
                pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
            }
        })
    };

    handleSearchResult = (aData, aSearchWord) => {
        this.setState({sSearchWord: aSearchWord});
        this.setVisibleData(aData, aSearchWord)
    };

    handlePubFilterData = (aFilterData) => {
        this.setState({sPubFiltedArray: aFilterData});
        this.setVisibleData(aFilterData, this.state.sSearchWord);
    };

    setVisibleData = (data, sSearchWord) => {
        let result = [];
        _.map(data, (item) => {
            let visible = true;
            const contentString = JSON.stringify(item).toLowerCase();
            if (sSearchWord) {
                visible = visible && contentString.indexOf(sSearchWord) > -1;
            }
            if (visible) {
                result.push(item);
            }
        });

        this.setState({sVisibleData: result, totalCount: result.length});
    };

    renderPubContainer = () => {
        const {sPubFiltedArray, sSearchWord, activePage, pageLimit} = this.state;

        let resultData = [].concat(this.state.sVisibleData);
        let renderData = resultData.splice((activePage - 1) * pageLimit, pageLimit);

        return (
            _.map(renderData, (pubItem, pubIndex) => {
                return (
                    <PubItem
                        key={`${pubItem.id}_${pubIndex}`}
                        pData={pubItem}
                    />
                )
            })
        )
    };

    handlePageChange(pageNumber) {
        this.setState({activePage: pageNumber});
    }

    render() {
        const {sPubData, sFetchStatus, sSearchWord, sIsMobileDimension, totalCount, pageLimit, activePage} = this.state;
        if (sFetchStatus) {
            return (
                <div className={sIsMobileDimension ? 'mobile-container-page-pub-search' : 'container-page-pub-search'}>
                    {
                        sIsMobileDimension &&
                        <div className='pub-search-inputer'>
                            <SearchInputer
                                isMobileDimension={sIsMobileDimension}
                                pData={sPubData}
                                defaultData={sSearchWord}
                                pHandleSearch={this.handleSearchResult}
                            />
                        </div>
                    }
                    <div className='pub-search-container'>
                        <div className="tab-container">
                            <div className='pub-search-header'>
                                <div className='pub-search-filter-panel'>
                                    {
                                        <BeerFilterSort
                                            pData={sPubData}
                                            pFilterArray={this.filterArray}
                                            pSortArray={this.sortArray}
                                            pHandleDataArray={this.handlePubFilterData}
                                        />
                                    }
                                </div>
                            </div>

                            <hr/>
                        </div>
                        {
                            this.renderPubContainer()
                        }
                        <div className="pagination-container">
                            <div className="column text-center">
                                {
                                    totalCount > pageLimit ? (<Pagination
                                        activePage={activePage}
                                        itemsCountPerPage={pageLimit}
                                        totalItemsCount={totalCount}
                                        pageRangeDisplayed={5}
                                        onChange={this.handlePageChange.bind(this)}
                                    />) : ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="loading-wrapper">
                    <Loading/>
                </div>
            );
        }
    }
}

PubSearch.propTypes = {};

PubSearch.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
            searchWord: state.search.searchWord
        }),
    )
)(PubSearch);