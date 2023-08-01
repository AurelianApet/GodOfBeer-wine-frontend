import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import _ from 'lodash';
import ModalImage from '../ModalImage'

class PubItem extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sBeerCount: 0
        }
    }

    componentDidMount = () => {
    };


    handlePushToDetail = () => {
        const {pData} = this.props;
        this.props.history.push(`/common/pubs/detail/${pData.id}`);
    };

    getAddress = () => {
        const {pData} = this.props;
        let result = '';
        const address = _.get(pData, 'uid.address') || {}
        if (typeof address === 'object') {
            result = `${address.buildingName || ''} ${address.roadAddress || ''} ${address.zonecode || ''}`;
        } else {
            result = address;
        }
        return result;
    };

    handlePushToDetail = () => {
        const {pData} = this.props;
        this.props.history.push(`/mobile/pubdetail?userId=${pData.userId}`);
    };

    render() {
        const {pData} = this.props;
        const pubImg = _.get(pData, 'image') || '';
        const address = _.get(pData, 'address') || '';
        return (
            <div className='container-component-pub-item'>
                <div className='pub-item-image'>
                    <ModalImage
                        pContent={{src: pubImg}}
                        pIsMobile={true}
                        pPubData={pData}
                    />
                </div>
                <div className='pub-detail-container'>
                    <div className="pub-detail-tag-content">
                        <div className='pub-detail-item pub-name'
                             onClick={this.handlePushToDetail}>
                            <label>{pData.name || ''}</label>
                        </div>
                    </div>
                    <div className='pub-detail-item'>
                        <span>{address}</span>
                    </div>
                    <div className='pub-detail-item'>
                        <span>{`${_.get(pData, 'wineCount') || 0} Beers`}</span>
                    </div>
                </div>
            </div>
        );
    }
}

PubItem.propTypes = {
    pData: PropTypes.object,
};

PubItem.defaultProps = {
    pData: {},
};

export default compose(
    withRouter,
    connect(
        state => ({
            user: state.auth.user,
        }),
    )
)(PubItem);