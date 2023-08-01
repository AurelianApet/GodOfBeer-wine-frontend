import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import _ from 'lodash';

import {
    MODE_CREATE, MODE_UPDATE, MODE_READ,
} from '../../../components/APIForm';
import SearchInputer from '../../../components/SearchInputer';
import NewBeerEnroll from './NewBeerEnroll';
import {confirmAlertMsg} from '../../../../library/utils/confirmAlert';
import LANG from '../../../../language';
import BeerTable, {TYPE_NO, TYPE_IMG, TYPE_DETAIL, TYPE_COUNT} from '../../../components/BeerTable';
import RateViewer from '../../../components/RateViewer';
import {executeQuery} from '../../../../library/utils/fetch';
import {
    pushNotification,
    NOTIFICATION_TYPE_WARNING,
    NOTIFICATION_TYPE_SUCCESS,
    NOTIFICATION_TYPE_ERROR
} from '../../../../library/utils/notification';

class SellerWineInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sUpdateId: '',
            sIsShowUpdateModal: false,
            sModalMode: MODE_READ,
            sSearchWord: props.searchWord,
            sIsMobileDimension: props.isMobileDimension,
            sColumns: [
                {
                    type: TYPE_NO,
                    title: 'No',
                },
                {
                    name: 'name',
                    title: '와인명',
                    className: 'pointer',
                    clickFunc: this.handleClickBeerTable
                },
                {
                    name: 'content',
                    title: 'Information',
                    customRender: this.renderWineInfo
                }
            ]
        };
    }

    componentDidMount() {
    }

    componentWillReceiveProps = (newProps) => {
        this.setState({
            sIsMobileDimension: newProps.isMobileDimension,
            sSearchWord: newProps.searchWord
        })
    };

    renderWineInfo(value, dataItem, columnItem) {
        return (
            <span>나라: {dataItem.country} / ABV: {dataItem.alcohol}% / 빈티지: {dataItem.vintage}  </span>
        )
    }
    /**
     * handle functinos
     **/
    handleSearchResult = (aData, aSearchWord) => {
        this.setState({
            sSearchWord: aSearchWord,
        })
    };

    handleModalShowChange = (aState, aComState) => {
        this.setState({
            sIsShowUpdateModal: aState,
        });
        if (aComState) {
            this.beerTable.refresh();
        }
    };

    handleClickBeerTable = (value, dataItem, columnItem) => {
        this.setState({
            sUpdateId: dataItem.id,
            sModalMode: MODE_UPDATE,
            sIsShowUpdateModal: true,
        })
    };

    handleCreateNewBeer = () => {
        this.setState({
            sIsShowUpdateModal: true,
            sModalMode: MODE_CREATE,
            sUpdateId: '',
        })
    };

    handleDeleteBeer = () => {
        const {location: {pathname}} = this.props;
        const selectedBeer = this.beerTable.getCheckedItems();
        if (selectedBeer.length === 0) {
            pushNotification(NOTIFICATION_TYPE_WARNING, '선택된 데이터가 없습니다')
        } else {
            let confirmParam = {
                title: LANG('BASIC_DELETE'),
                detail: LANG('BASIC_ALERTMSG_DELETE_WINE'),
                confirmTitle: LANG('BASIC_ALERTMSG_YES'),
                noTitle: LANG('BASIC_ALERTMSG_NO'),
                confirmFunc: this.processDeleteBeer,
            };
            confirmAlertMsg(confirmParam, pathname);
        }
    };

    processDeleteBeer = () => {
        const selectedBeer = this.beerTable.getCheckedItems();
        let ids = [];
        _.map(selectedBeer, (beerItem, beerIndex) => {
            ids.push(beerItem.id);
        });
        if (ids.length > 0) {
            executeQuery({
                method: 'post',
                url: '/wine/multidel',
                data: {
                    ids,
                },
                success: (res) => {
                    const warnings = res.warnings || [];
                    if (warnings.length > 0) {
                        _.map(warnings, (warningItem, index) => {
                            pushNotification(NOTIFICATION_TYPE_WARNING, warningItem);
                        })
                    } else {
                        pushNotification(NOTIFICATION_TYPE_SUCCESS, '삭제가 완료되었습니다');
                        this.beerTable.refresh();
                    }
                },
                fail: (err, res) => {
                    const errMsg = _.get(err, 'data.error');
                    pushNotification(NOTIFICATION_TYPE_ERROR, errMsg);
                }
            })
        } else {
        }
    };


    /**
     * process functions
     **/


    /**
     * other functions
     **/


    /**
     * render functions
     **/

    renderDescription = (value, dataItem, columnItem) => {
        const pubs = dataItem.pubs || [];
        const reviews = dataItem.reviews || [];
        let rate = 0;
        _.map(reviews, (reviewItem, reviewIndex) => {
            rate += Number(reviewItem.marks) || 0;
        });
        if (reviews.length !== 0) {
            rate = rate / reviews.length;
            rate = Math.round(rate * 100) / 100;
        }
        return (
            <div>
                <div>{dataItem.name}</div>
                <div>{dataItem.uid.storeName}</div>
                <div>{`${dataItem.country} / ${dataItem.style} / ${dataItem.alcohol}도 / (IBU : ${dataItem.ibu})`}</div>
                <div>{`매 장 수 : ${pubs.length}개`}</div>
                <div className='review-container'>
                    <RateViewer
                        value={rate}
                    />
                    <span className='rate-container'>{rate}</span>
                    <span>{`Reviews(${reviews.length})`}</span>
                </div>
            </div>
        );
    };

    renderPhoto = (aRow, aColumn, aRowId) => {
        const url = _.get(aRow, 'avatar') || '';
        return (
            <div className='small-photo'>
                <img src={url || '/assets/images/producer/user-profile-not-found.jpeg'} onError={(e) => {
                    e.target.src = '/assets/images/producer/user-profile-not-found.jpeg'
                }} alt=''/>
            </div>
        )
    };

    renderBeerTable = () => {
        const {sColumns, sSearchWord} = this.state;
        const userId = _.get(this.props, 'user.id') || '';
        if (userId) {
            return (
                <BeerTable
                    onRef={(ref) => {
                        this.beerTable = ref
                    }}
                    url={`/wine/fetchall`}
                    getDataFunc={(res) => {
                        return res.beer || []
                    }}
                    pColumns={sColumns}
                    pSearchWord={sSearchWord}
                    operation={{
                        multiCheck: false,
                    }}
                />
            )
        }

    };

    render() {
        const {sModalMode, sUpdateId, sIsShowUpdateModal, sIsMobileDimension, sSearchWord} = this.state;
        return (
            <div className={sIsMobileDimension ? 'mobile-container-page-producer-wine' : 'container-page-producer-wineinfo'}>
                <div className="commonBorder border-style">
                    <div className="overflow">
                        <div className="panel-heading div-heading flex-heading">
                            <div id="header-title1"><p>와인정보</p></div>
                            {/*<div className="margin-bottom">*/}
                            {/*    <button className="createBeer" onClick={this.handleCreateNewBeer}>추가</button>*/}
                            {/*    <button className="createBeer" onClick={this.handleDeleteBeer}>삭제</button>*/}
                            {/*</div>*/}
                        </div>
                        {
                            sIsMobileDimension &&
                            <div className='beer-info-inputer'>
                                <SearchInputer
                                    isMobileDimension={sIsMobileDimension}
                                    pData={null}
                                    defaultData={sSearchWord}
                                    pHandleSearch={this.handleSearchResult}
                                />
                            </div>
                        }
                        <div className='beer-info-table'>
                            {this.renderBeerTable()}
                        </div>
                    </div>
                </div>
                {sIsShowUpdateModal &&
                <NewBeerEnroll
                    handleModalClose={this.handleModalShowChange}
                    pMode={sModalMode}
                    pId={sUpdateId}
                />
                }
            </div>
        );
    }
}

SellerWineInfo.propTypes = {};

SellerWineInfo.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
            searchWord: state.search.searchWord
        }),
    )
)(SellerWineInfo);
