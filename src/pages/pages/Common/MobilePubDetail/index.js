import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {compose} from 'redux';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {executeQuery} from "../../../../library/utils/fetch";
import _ from "lodash";
import {NOTIFICATION_TYPE_ERROR, pushNotification} from "../../../../library/utils/notification";
import {maskNumber, numberUnmask} from '../../../../library/utils/masks';
import cn from 'classnames';

export class MobilePubDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            wineList : [],
        }
    }

    componentDidMount () {
        let searchString = this.props.location.search;
        let userId = searchString.slice(8, searchString.length);
        if(userId) {
            this.getWineInfo(userId);
        }
    }

    getWineInfo = (id) => {
        let url = '/mobile/pubdetail';
        executeQuery({
            method: 'post',
            url: url,
            data: {
                userId: id,
            },
            success: ( res ) => {
                this.setState({
                    wineList: res.wineList,
                })
            },
            fail: ( err ) => {
                const errResult = _.get(err, 'data.error') || '데이터 얻기 실패';
                if (errResult) {
                    pushNotification(NOTIFICATION_TYPE_ERROR, errResult);
                }
            }
        })
    };

    filterCurrencyInt = (src) => {
        if (!src) src = 0;
        src = (src * 1).toFixed(2);
        const strSrc = src + "";
        let strPrefix = strSrc.split(".")[0];

        strPrefix = strPrefix.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return strPrefix;
    };

    render() {
        const {wineList} = this.state;
        return (
            <div className="mobile-order-info">
                <table>
                    <thead>
                        <tr>
                            <th className='wineNo'>No</th>
                            <th>Wine</th>
                            <th className='winePrice'>Tasting</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        wineList.map((item, index) => (
                            <tr key={index} className={cn(index % 2 === 0 ? 'even' : 'odd')}>
                                <td className='wineNo'>{index + 1}</td>
                                <td>{item.menu_name}</td>
                                <td className='winePrice'>{maskNumber(item.price)}</td>
                            </tr>
                        ))
                    }
                    </tbody>
                </table>
            </div>
        );
    }
}

MobilePubDetail.propTypes = {
    location: PropTypes.object.isRequired,
};

MobilePubDetail.defaultProps = {};

export default compose(
    withRouter,
    connect(
        state => ({
            auth: state.auth,
        }),
        {}
    )
)(MobilePubDetail);

