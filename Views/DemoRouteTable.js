import React from 'react';
import {ListView, Text, View, TouchableHighlight, StyleSheet} from 'react-native';
import {Cell, Section, TableView} from 'react-native-tableview-simple';

export class DemoRouteTable extends React.Component {
  constructor(props) {
    super(props);
  }

  formatRouteData(routes) {
    return Object.keys(routes).map(r => routes[r]);
  }

  handleCellPress(route) {
    this.props.selectDemoRoute(route);
  }

  render() {
    const routes = this.formatRouteData(this.props.routes);
    const cells = routes.map((r, i) =>
      <Cell key={i} title={r.name} onPress={() => {
        this.handleCellPress(r);
      }}
      />
    );

    return (
      <View style={styles.table}>
        <TableView>
          <Section header="Demo Routes">
            {cells}
          </Section>
        </TableView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  table: {
    width: 300,
    flex: 0
  }
});