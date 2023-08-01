import React, { Component } from 'react';
import _ from 'lodash';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import BeerTable, { TYPE_NO , TYPE_DATE} from '../../components/BeerTable';

class PubManager extends Component {

  constructor(props) {
    super(props);
    this.state = {
    }
  }

  componentDidMount = () => {
  }

  pubDetailShow = (value, dataItem, columnItem) => {
    this.props.history.push(`/pubmanager/brewery/detail/${dataItem.id}`);
  }
  
  render() {
    const wineId = _.get(this.props, 'match.params.id') || '';
    const userId = _.get(this.props, 'user.id');
    let url;
    if(wineId) {
      console.log(wineId);
      url = `/wine/fetchpubs?id=` + wineId;
    }
    else {
      url = `/user/fetchone?id=` + userId;
    }
    return (
      <div className='container-page-pubmanager'>
        <div className = 'container-page-pubmanager-background'>
          <div className = 'pub-data-info-title'>관리매장</div>
          {
            <BeerTable
              onRef={(ref) => {this.beerTable = ref}}
              url={url}
              getDataFunc={( res ) => {return _.get(res, 'user.pubs') || []}}
              pColumns={[
                {
                  type: TYPE_NO,
                  title: 'NO.'
                },
                {
                  name: 'name',
                  title: '매장명',
                  className: 'pub-detail-show',
                  clickFunc: this.pubDetailShow
                },
                {
                  name: 'sido',
                  title: '주소', 
                },
                {
                  name: 'reg_datetime',
                  title: '가입일',
                  type: TYPE_DATE
                },
                {
                  name: 'userID',
                  title: 'ID',
                },
                {
                  name: 'realName',
                  title: '담당자',
                },
                {
                  name: 'callNumber',
                  title: '담당자번호',
                }
              ]}
            />
          }
        </div>
      </div>
    );
  }
}

PubManager.propTypes = {
};

PubManager.defaultProps = {
};

export default compose(
  withRouter,
  connect(
    state => ({
      user: state.auth.user,
    }),
  )
)(PubManager);