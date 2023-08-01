import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {compose} from 'redux';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import PubItem from '../../../components/PubItem';
import SearchInputer from '../../../components/SearchInputer';
import {executeQuery} from "../../../../library/utils/fetch";
import _ from "lodash";
import {NOTIFICATION_TYPE_ERROR, pushNotification} from "../../../../library/utils/notification";
import cn from 'classnames';
import { CookieStorage } from 'amazon-cognito-identity-js';

export class MobilePubMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pubList : [],
            sSearchWord: props.searchWord,
            sVisibleData : []
        }
    }

    componentDidMount () {
        this.getPubInfo();
    }

    componentWillReceiveProps = (newProps) => {
        this.setState({
            sSearchWord: newProps.searchWord
        });
        this.setVisibleData(this.state.pubList, newProps.searchWord);
    };

    getPubInfo = () => {
        let url = '/mobile/pubmenu';
        executeQuery({
            method: 'get',
            url: url,
            success: ( res ) => {
                this.setState({
                    pubList: res.pubList,
                });
                this.setVisibleData(res.pubList, this.state.sSearchWord);
            },
            fail: ( err ) => {
                const errResult = _.get(err, 'data.error') || '데이터 얻기 실패';
                if (errResult) {
                    pushNotification(NOTIFICATION_TYPE_ERROR, errResult);
                }
            }
        })
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

        this.setState({sVisibleData: result});
    };


    filterCurrencyInt = (src) => {
        if (!src) src = 0;
        src = (src * 1).toFixed(2);
        const strSrc = src + "";
        let strPrefix = strSrc.split(".")[0];

        strPrefix = strPrefix.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return strPrefix;
    };

    handleSearchResult = (aData, aSearchWord) => {
        this.setState({sSearchWord: aSearchWord});
        this.setVisibleData(aData, aSearchWord)
    };

    render() {
        const {sVisibleData, sSearchWord} = this.state;
        return (
            <div className='mobile-container-page-pub-search'>
                <div className='pub-search-container'>
                {
                    _.map(sVisibleData, (pubItem, pubIndex) => {
                        return (
                            <PubItem
                                key={`${pubItem.id}_${pubIndex}`}
                                pData={pubItem}
                            />
                        )
                    })
                }
                </div>
            </div>
        )
    }
}

MobilePubMenu.propTypes = {
    location: PropTypes.object.isRequired,
};

MobilePubMenu.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            auth: state.auth,
            searchWord: state.search.searchWord
        }),
        {}
    )
)(MobilePubMenu);

