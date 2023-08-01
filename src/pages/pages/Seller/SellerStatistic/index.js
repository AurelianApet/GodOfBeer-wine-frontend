import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import _ from 'lodash';

import MonthStatistic from './MonthStatistic';
import PeriodStatistic from './PeriodStatistic';
import MenuStatistic from './MenuStatistic';
import BeerStatistic from './BeerStatistic';

import {executeQuery} from '../../../../library/utils/fetch';
import Loading from '../../../components/Loading';

import {
    pushNotification,
    NOTIFICATION_TYPE_WARNING,
    NOTIFICATION_TYPE_SUCCESS,
    NOTIFICATION_TYPE_ERROR
} from '../../../../library/utils/notification';
class SellerStatistic extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sPaymentData: [],
            sServiceInfo: {},
            sFetchStatus: true,
        }
    }

    componentDidMount() {
        const userId = _.get(this.props, 'user.id') || '';
        this.getPaymentData(userId);
    }

    componentWillReceiveProps(newProps) {
        const userId = _.get(newProps, 'user.id') || '';
        this.getPaymentData(userId);
    }

    getPaymentData = (aID) => {
        if (aID) {
            executeQuery({
                method: 'get',
                url: `/pub/fetchone?uid=${aID}`,
                success: (res) => {
                    const result = res.pub || [];
                    const pubId = _.get(result, '[0]._id');
                    this.setState({
                        sFetchStatus: true,
                        sPaymentData: [],
                        sServiceInfo: {}
                    })
            // executeQuery({
            //     method: 'get',
            //     url: `/payment/fetchlist?uid=${aID}`,
            //     success: (res) => {
            //         const payment = res.payments || [];
            //         const serviceInfo = res.serviceInfo || {};
            //         this.setState({
            //             sFetchStatus: true,
            //             sPaymentData: payment,
            //             sServiceInfo: serviceInfo
            //         })
                },
                fail: (err, res) => {
                }
            })
        }
    }

    render() {
        const {sPaymentData, sFetchStatus, sServiceInfo} = this.state;
        const userId = _.get(this.props, 'user.pubs') || '';
        if (sFetchStatus) {
            return (
                <div className='container-page-seller-statistic'>
                    <MonthStatistic
                        pData={sPaymentData}
                        pServiceInfo={sServiceInfo}
                        pubId={userId}
                    />
                    <PeriodStatistic
                        pData={sPaymentData}
                        pServiceInfo={sServiceInfo}
                        pubId={userId}
                    />
                    <MenuStatistic
                        pData={sPaymentData}
                        pubId={userId}
                    />
                    {/*<BeerStatistic*/}
                    {/*    pData={sPaymentData}*/}
                    {/*    pubId={userId}*/}
                    {/*/>*/}
                </div>
            );
        } else {
            return (
                <div className="loading-wrapper">
                    <Loading/>
                </div>
            )
        }
    }
}

SellerStatistic.propTypes = {
    pData: PropTypes.array,
};

SellerStatistic.defaultProps = {
    pData: [],
};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
    )
)(SellerStatistic);
